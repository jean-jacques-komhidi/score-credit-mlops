import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from api.schemas.client import ClientData
import pickle
import numpy as np
import pandas as pd
import shap
from sqlalchemy import create_engine, text

router = APIRouter()


# ─────────────────────────────────────────────
# CHARGEMENT DU MODÈLE, COLONNES, MÉDIANES, SHAP
# ─────────────────────────────────────────────
try:
    print("1️⃣ Chargement best_xgb.pkl...")
    with open('notebooks/models/best_xgb.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ best_xgb.pkl OK")

    print("2️⃣ Chargement feature_columns.pkl...")
    with open('notebooks/models/feature_columns.pkl', 'rb') as f:
        feature_columns = pickle.load(f)
    print("✅ feature_columns.pkl OK")

    print("3️⃣ Chargement feature_medians.pkl...")
    with open('notebooks/models/feature_medians.pkl', 'rb') as f:
        feature_medians = pickle.load(f)
    print("✅ feature_medians.pkl OK")

    print("4️⃣ Chargement SHAP...")
    explainer = shap.TreeExplainer(model)
    print("✅ SHAP OK")

except Exception as e:
    import traceback
    print(f"⚠️ Erreur chargement : {e}")
    traceback.print_exc()
    model = None
    feature_columns = []
    feature_medians = {}
    explainer = None


# ─────────────────────────────────────────────
# CONNEXION POSTGRESQL
# ─────────────────────────────────────────────
try:
    db_engine = create_engine('postgresql://postgres:postgres123@localhost:5432/score_credit_db')
    print("✅ Connexion PostgreSQL score_credit_db OK !")
except Exception as e:
    print(f"⚠️ Erreur connexion DB : {e}")
    db_engine = None


# ─────────────────────────────────────────────
# CONSTANTES SCORE MÉTIER
# ─────────────────────────────────────────────
COUT_FN = 10
COUT_FP = 1

# Champs réellement saisis par l'utilisateur dans le formulaire
CHAMPS_FORMULAIRE = [
    'EXT_SOURCE_2', 'EXT_SOURCE_3',
    'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY', 'AMT_GOODS_PRICE',
    'CNT_CHILDREN', 'CNT_FAM_MEMBERS',
    'NAME_CONTRACT_TYPE', 'FLAG_OWN_CAR', 'FLAG_OWN_REALTY', 'CODE_GENDER_M',
    'AGE_YEARS', 'YEARS_EMPLOYED',
    'CREDIT_INCOME_RATIO', 'ANNUITY_INCOME_RATIO',
    'CREDIT_GOODS_RATIO', 'CREDIT_DURATION',
    'DAYS_EMPLOYED_ANOMALY'
]


# ─────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────
def calculer_niveau_risque(proba: float) -> str:
    if proba < 0.2:
        return "FAIBLE"
    elif proba < 0.5:
        return "MODÉRÉ"
    elif proba < 0.7:
        return "ÉLEVÉ"
    else:
        return "TRÈS ÉLEVÉ"


def log_action(type_action: str, titre: str, message: str, statut: str = "info"):
    if db_engine:
        try:
            with db_engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO actions_log (type, titre, message, statut)
                    VALUES (:type, :titre, :message, :statut)
                """), {
                    "type": type_action,
                    "titre": titre,
                    "message": message,
                    "statut": statut
                })
                conn.commit()
        except Exception as e:
            print(f"⚠️ Erreur log action : {e}")


def generer_explication(decision, shap_features, client_dict):
    labels = {
        "EXT_SOURCE_3": "score de solvabilité externe 3",
        "EXT_SOURCE_2": "score de solvabilité externe 2",
        "CREDIT_INCOME_RATIO": "ratio crédit/revenu",
        "ANNUITY_INCOME_RATIO": "ratio mensualité/revenu",
        "CREDIT_DURATION": "durée du crédit",
        "CREDIT_GOODS_RATIO": "ratio crédit/valeur du bien",
        "AGE_YEARS": "âge du client",
        "YEARS_EMPLOYED": "ancienneté professionnelle",
        "DAYS_EMPLOYED_ANOMALY": "situation d'emploi",
        "AMT_CREDIT": "montant du crédit",
        "AMT_GOODS_PRICE": "prix du bien",
        "AMT_INCOME_TOTAL": "revenu annuel",
        "AMT_ANNUITY": "mensualité",
        "CNT_CHILDREN": "nombre d'enfants",
        "CODE_GENDER_M": "genre",
        "FLAG_OWN_CAR": "possession d'une voiture",
        "FLAG_OWN_REALTY": "possession d'un bien immobilier",
        "NAME_CONTRACT_TYPE": "type de contrat",
        "CNT_FAM_MEMBERS": "nombre de membres de la famille",
    }

    risque = [f for f in shap_features if f["direction"] == "risque"][:3]
    protection = [f for f in shap_features if f["direction"] == "protection"][:3]
    lignes = []

    if decision == "REFUSÉ":
        lignes.append("❌ Le crédit a été refusé principalement à cause des facteurs suivants :\n")
        for f in risque:
            label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
            lignes.append(f"  • Votre {label} augmente significativement le risque de défaut.")
        if protection:
            lignes.append("\n✨ Points positifs de votre dossier :\n")
            for f in protection:
                label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
                lignes.append(f"  • Votre {label} joue en votre faveur.")
        lignes.append("\n💡 Conseil : Améliorez votre score de solvabilité ou réduisez le montant demandé.")
    else:
        lignes.append("✅ Le crédit a été accordé grâce aux facteurs suivants :\n")
        for f in protection:
            label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
            lignes.append(f"  • Votre {label} rassure sur votre capacité de remboursement.")
        if risque:
            lignes.append("\n⚠️ Points de vigilance :\n")
            for f in risque:
                label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
                lignes.append(f"  • Votre {label} représente un léger facteur de risque.")

    return "\n".join(lignes)


def construire_features(client: ClientData) -> pd.DataFrame:
    """
    Initialise les 178 features avec les médianes du dataset d'entraînement,
    puis écrase avec les valeurs réellement saisies par l'utilisateur.
    """
    data = pd.DataFrame([feature_medians], columns=feature_columns)

    client_dict = client.dict()
    for col, val in client_dict.items():
        if col in data.columns:
            data[col] = val

    data['AGE_YEARS'] = abs(client.DAYS_BIRTH) // 365
    data['YEARS_EMPLOYED'] = abs(client.DAYS_EMPLOYED) / 365
    data['CREDIT_INCOME_RATIO'] = client.AMT_CREDIT / client.AMT_INCOME_TOTAL
    data['ANNUITY_INCOME_RATIO'] = client.AMT_ANNUITY / client.AMT_INCOME_TOTAL
    data['CREDIT_GOODS_RATIO'] = client.AMT_CREDIT / client.AMT_GOODS_PRICE
    data['CREDIT_DURATION'] = client.AMT_CREDIT / client.AMT_ANNUITY
    data['DAYS_EMPLOYED_ANOMALY'] = 1 if client.DAYS_EMPLOYED == 0 else 0

    return data


# ─────────────────────────────────────────────
# ENDPOINT : PRÉDICTION
# ─────────────────────────────────────────────
@router.post("/predict")
def predict(client: ClientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Modèle non disponible")

    data = construire_features(client)

    proba = model.predict_proba(data)[0][1]
    prediction = int(proba >= 0.5)
    score = COUT_FN * prediction + COUT_FP * (1 - prediction)
    decision = "REFUSÉ" if prediction == 1 else "ACCORDÉ"

    shap_values = explainer.shap_values(data)[0]
    shap_dict = dict(zip(feature_columns, shap_values.tolist()))

    # Uniquement les features réellement saisies par l'utilisateur
    top_features = sorted(
        [(f, v) for f, v in shap_dict.items() if f in CHAMPS_FORMULAIRE],
        key=lambda x: abs(x[1]),
        reverse=True
    )[:10]

    shap_features = [
        {
            "feature": f,
            "impact": round(v, 4),
            "direction": "risque" if v > 0 else "protection"
        }
        for f, v in top_features
    ]

    explication = generer_explication(decision, shap_features, client.dict())

    if db_engine:
        try:
            with db_engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO predictions
                    (revenu, credit, annuite, age, anciennete, decision,
                     probabilite_defaut, niveau_risque, score_metier, score)
                    VALUES (:revenu, :credit, :annuite, :age, :anciennete, :decision,
                            :probabilite_defaut, :niveau_risque, :score_metier, :score)
                """), {
                    "revenu": client.AMT_INCOME_TOTAL,
                    "credit": client.AMT_CREDIT,
                    "annuite": client.AMT_ANNUITY,
                    "age": int(abs(client.DAYS_BIRTH) // 365),
                    "anciennete": int(abs(client.DAYS_EMPLOYED) / 365),
                    "decision": decision,
                    "probabilite_defaut": round(float(proba) * 100, 2),
                    "niveau_risque": calculer_niveau_risque(proba),
                    "score_metier": float(score),
                    "score": round(float(proba), 4)
                })
                conn.commit()
                print("✅ Prédiction sauvegardée !")

            log_action(
                "prediction",
                "Nouvelle prédiction",
                f"Décision : {decision} — Probabilité : {round(float(proba)*100, 2)}% — Risque : {calculer_niveau_risque(proba)}",
                "success" if decision == "ACCORDÉ" else "warning"
            )

        except Exception as e:
            print(f"⚠️ Erreur sauvegarde : {e}")

    return {
        "score": round(float(proba), 4),
        "probabilite_defaut": round(float(proba) * 100, 2),
        "decision": decision,
        "niveau_risque": calculer_niveau_risque(proba),
        "score_metier": float(score),
        "shap_features": shap_features,
        "explication": explication
    }


# ─────────────────────────────────────────────
# ENDPOINT : HISTORIQUE DES PRÉDICTIONS
# ─────────────────────────────────────────────
@router.get("/historique")
def historique():
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, date_analyse, revenu, credit, annuite, age,
                       anciennete, decision, probabilite_defaut,
                       niveau_risque, score_metier, score
                FROM predictions
                ORDER BY date_analyse DESC
                LIMIT 50
            """))
            rows = result.fetchall()
            return [
                {
                    "id": r[0],
                    "date": r[1].strftime("%Y-%m-%d %H:%M"),
                    "revenu": r[2],
                    "credit": r[3],
                    "annuite": r[4],
                    "age": r[5],
                    "anciennete": r[6],
                    "decision": r[7],
                    "probabilite_defaut": r[8],
                    "niveau_risque": r[9],
                    "score_metier": r[10],
                    "score": r[11]
                }
                for r in rows
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : STATISTIQUES GLOBALES
# ─────────────────────────────────────────────
@router.get("/stats")
def stats():
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN decision = 'ACCORDÉ' THEN 1 ELSE 0 END) as accordes,
                    SUM(CASE WHEN decision = 'REFUSÉ' THEN 1 ELSE 0 END) as refuses,
                    ROUND(AVG(probabilite_defaut)::numeric, 2) as proba_moyenne
                FROM predictions
            """))
            row = result.fetchone()
            total = row[0] or 0
            accordes = row[1] or 0
            refuses = row[2] or 0
            proba_moyenne = float(row[3]) if row[3] else 0
            taux_accord = round((accordes / total * 100), 1) if total > 0 else 0

            return {
                "total": total,
                "accordes": accordes,
                "refuses": refuses,
                "taux_accord": taux_accord,
                "proba_moyenne": proba_moyenne
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : SANTÉ DE L'API
# ─────────────────────────────────────────────
@router.get("/health")
def health():
    return {"status": "OK", "model_loaded": model is not None}


# ─────────────────────────────────────────────
# ENDPOINT : RUNS MLFLOW
# ─────────────────────────────────────────────
@router.get("/mlflow-runs")
def mlflow_runs():
    try:
        import mlflow
        mlflow.set_tracking_uri("http://127.0.0.1:5000")
        client = mlflow.tracking.MlflowClient()

        experiments = client.search_experiments()
        seen_models = {}

        for exp in experiments:
            runs = client.search_runs(
                experiment_ids=[exp.experiment_id],
                order_by=["metrics.auc_roc DESC"],
                max_results=20
            )
            for run in runs:
                modele = run.data.params.get("model", "N/A")
                auc = run.data.metrics.get("auc_roc", 0)
                score = run.data.metrics.get("score_metier", 0)

                if auc > 0 and (modele not in seen_models or auc > seen_models[modele]["auc_roc"]):
                    seen_models[modele] = {
                        "run_id": run.info.run_id[:8],
                        "nom": run.data.tags.get("mlflow.runName", modele),
                        "modele": modele,
                        "auc_roc": round(auc, 4),
                        "score_metier": score,
                        "statut": "✅ Terminé"
                    }

        runs_data = sorted(seen_models.values(), key=lambda x: x["auc_roc"], reverse=True)
        return runs_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : ANALYSE DU DATA DRIFT
# ─────────────────────────────────────────────
@router.get("/drift-stats")
def drift_stats():
    try:
        engine = create_engine('postgresql://postgres:postgres123@localhost:5432/score_credit_db')

        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT
                    AVG(revenu) as moy_revenu,
                    AVG(credit) as moy_credit,
                    AVG(annuite) as moy_annuite,
                    COUNT(*) as total
                FROM predictions
            """))
            row = result.fetchone()

        ref_stats = {
            "revenu": 167652,
            "credit": 595257,
            "annuite": 26987
        }

        prod_stats = {
            "revenu": float(row[0]) if row[0] else 0,
            "credit": float(row[1]) if row[1] else 0,
            "annuite": float(row[2]) if row[2] else 0,
        }

        features = [
            {"feature": "Revenu annuel", "ref": ref_stats["revenu"], "prod": prod_stats["revenu"]},
            {"feature": "Montant crédit", "ref": ref_stats["credit"], "prod": prod_stats["credit"]},
            {"feature": "Mensualité", "ref": ref_stats["annuite"], "prod": prod_stats["annuite"]},
        ]

        drift_results = []
        for f in features:
            ecart = abs(f["prod"] - f["ref"]) / f["ref"] * 100 if f["ref"] > 0 else 0
            statut = "CRITIQUE" if ecart > 40 else "ALERTE" if ecart > 20 else "NORMAL"
            drift_results.append({
                "feature": f["feature"],
                "ref_mean": round(f["ref"], 0),
                "prod_mean": round(f["prod"], 0),
                "ecart_pct": round(ecart, 1),
                "statut": statut
            })

        return {
            "total_predictions": int(row[3]) if row[3] else 0,
            "drift_features": drift_results,
            "statut_global": "NORMAL" if all(d["statut"] == "NORMAL" for d in drift_results) else "ALERTE"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : HISTORIQUE DES ACTIONS SYSTÈME
# ─────────────────────────────────────────────
@router.get("/actions-log")
def actions_log():
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, date_action, type, titre, message, statut
                FROM actions_log
                ORDER BY date_action DESC
                LIMIT 20
            """))
            rows = result.fetchall()
            return [
                {
                    "id": r[0],
                    "date": r[1].strftime("%Y-%m-%d %H:%M"),
                    "type": r[2],
                    "titre": r[3],
                    "message": r[4],
                    "statut": r[5]
                }
                for r in rows
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : RAPPORT DATA DRIFT (HTML)
# ─────────────────────────────────────────────
@router.get("/drift-report")
def drift_report():
    report_path = "data/rapport_drift.html"
    if os.path.exists(report_path):
        return FileResponse(report_path, media_type="text/html")
    raise HTTPException(
        status_code=404,
        detail="Rapport non trouvé. Générez-le depuis le notebook 04_data_drift.ipynb"
    )