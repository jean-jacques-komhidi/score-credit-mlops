from fastapi import APIRouter, HTTPException
from api.schemas.client import ClientData
import pickle
import numpy as np
import pandas as pd
import shap
from sqlalchemy import create_engine, text

router = APIRouter()

# Chargement du modèle
try:
    with open('notebooks/models/best_xgb.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('notebooks/models/feature_columns.pkl', 'rb') as f:
        feature_columns = pickle.load(f)
    explainer = shap.TreeExplainer(model)
    print("✅ Modèle, colonnes et SHAP chargés avec succès !")
except Exception as e:
    print(f"⚠️ Erreur chargement : {e}")
    model = None
    feature_columns = []
    explainer = None

# Connexion PostgreSQL
try:
    db_engine = create_engine('postgresql://postgres:postgres123@localhost:5432/score_credit_db')
    print("✅ Connexion PostgreSQL score_credit_db OK !")
except Exception as e:
    print(f"⚠️ Erreur connexion DB : {e}")
    db_engine = None

COUT_FN = 10
COUT_FP = 1

def calculer_niveau_risque(proba: float) -> str:
    if proba < 0.2:
        return "FAIBLE"
    elif proba < 0.5:
        return "MODÉRÉ"
    elif proba < 0.7:
        return "ÉLEVÉ"
    else:
        return "TRÈS ÉLEVÉ"

def generer_explication(decision, shap_features, client_dict):
    labels = {
        "EXT_SOURCE_3": "score de solvabilité externe 3",
        "EXT_SOURCE_2": "score de solvabilité externe 2",
        "CREDIT_INCOME_RATIO": "ratio crédit/revenu",
        "ANNUITY_INCOME_RATIO": "ratio mensualité/revenu",
        "CREDIT_DURATION": "durée du crédit",
        "CREDIT_GOODS_RATIO": "ratio crédit/valeur du bien",
        "AGE_YEARS": "âge",
        "YEARS_EMPLOYED": "ancienneté professionnelle",
        "DAYS_EMPLOYED_ANOMALY": "situation d'emploi",
        "AMT_CREDIT": "montant du crédit",
        "AMT_INCOME_TOTAL": "revenu annuel",
        "AMT_ANNUITY": "mensualité",
        "CNT_CHILDREN": "nombre d'enfants",
        "CODE_GENDER_M": "genre",
        "FLAG_OWN_CAR": "possession d'une voiture",
        "FLAG_OWN_REALTY": "possession d'un bien immobilier",
        "FLAG_EMP_PHONE": "téléphone professionnel",
        "FLAG_WORK_PHONE": "téléphone au travail",
        "FLAG_PHONE": "téléphone fixe",
        "FLAG_MOBIL": "téléphone mobile",
        "FLAG_EMAIL": "adresse email",
        "REGION_POPULATION_RELATIVE": "densité de population régionale",
        "REGION_RATING_CLIENT": "note de la région",
        "REGION_RATING_CLIENT_W_CITY": "note de la région (avec ville)",
        "OBS_30_CNT_SOCIAL_CIRCLE": "entourage social (30 jours)",
        "OBS_60_CNT_SOCIAL_CIRCLE": "entourage social (60 jours)",
        "DEF_30_CNT_SOCIAL_CIRCLE": "défauts dans l'entourage (30 jours)",
        "DEF_60_CNT_SOCIAL_CIRCLE": "défauts dans l'entourage (60 jours)",
        "AMT_REQ_CREDIT_BUREAU_YEAR": "demandes de crédit sur 1 an",
        "AMT_REQ_CREDIT_BUREAU_MON": "demandes de crédit sur 1 mois",
        "AMT_REQ_CREDIT_BUREAU_QRT": "demandes de crédit sur un trimestre",
        "AMT_REQ_CREDIT_BUREAU_WEEK": "demandes de crédit sur une semaine",
        "AMT_REQ_CREDIT_BUREAU_DAY": "demandes de crédit sur un jour",
        "AMT_REQ_CREDIT_BUREAU_HOUR": "demandes de crédit sur une heure",
        "NAME_INCOME_TYPE_Working": "statut de salarié",
        "NAME_INCOME_TYPE_Commercial associate": "statut de travailleur commercial",
        "NAME_INCOME_TYPE_Pensioner": "statut de retraité",
        "NAME_INCOME_TYPE_State_servant": "statut de fonctionnaire",
        "NAME_INCOME_TYPE_Student": "statut d'étudiant",
        "NAME_INCOME_TYPE_Unemployed": "statut de chômeur",
        "NAME_EDUCATION_TYPE_Higher education": "niveau d'études supérieures",
        "NAME_EDUCATION_TYPE_Secondary / secondary special": "niveau d'études secondaires",
        "NAME_EDUCATION_TYPE_Incomplete higher": "études supérieures incomplètes",
        "NAME_EDUCATION_TYPE_Lower secondary": "niveau primaire",
        "NAME_FAMILY_STATUS_Married": "statut marital (marié)",
        "NAME_FAMILY_STATUS_Single / not married": "statut célibataire",
        "NAME_FAMILY_STATUS_Separated": "statut séparé",
        "NAME_FAMILY_STATUS_Widow": "statut veuf/veuve",
        "NAME_HOUSING_TYPE_House / apartment": "type de logement (maison/appartement)",
        "NAME_HOUSING_TYPE_With parents": "logement chez les parents",
        "NAME_HOUSING_TYPE_Municipal apartment": "appartement municipal",
        "NAME_HOUSING_TYPE_Rented apartment": "appartement en location",
        "NAME_TYPE_SUITE_Unaccompanied": "accompagnement lors de la demande",
        "NAME_TYPE_SUITE_Family": "accompagné par la famille",
        "OCCUPATION_TYPE_Laborers": "profession d'ouvrier",
        "OCCUPATION_TYPE_Core staff": "personnel principal",
        "OCCUPATION_TYPE_Managers": "profession de manager",
        "OCCUPATION_TYPE_Drivers": "profession de chauffeur",
        "OCCUPATION_TYPE_Sales staff": "personnel de vente",
        "OCCUPATION_TYPE_Security staff": "personnel de sécurité",
        "OCCUPATION_TYPE_Medicine staff": "personnel médical",
        "DAYS_LAST_PHONE_CHANGE": "changement récent de téléphone",
        "DAYS_REGISTRATION": "ancienneté d'enregistrement",
        "DAYS_ID_PUBLISH": "ancienneté du document d'identité",
        "HOUR_APPR_PROCESS_START": "heure de la demande",
        "CNT_FAM_MEMBERS": "nombre de membres de la famille",
        "NAME_CONTRACT_TYPE": "type de contrat",
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


@router.post("/predict")
def predict(client: ClientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Modèle non disponible")

    data = pd.DataFrame(0, index=[0], columns=feature_columns)

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

    proba = model.predict_proba(data)[0][1]
    prediction = int(proba >= 0.5)
    score = COUT_FN * prediction + COUT_FP * (1 - prediction)
    decision = "REFUSÉ" if prediction == 1 else "ACCORDÉ"

    shap_values = explainer.shap_values(data)[0]
    shap_dict = dict(zip(feature_columns, shap_values.tolist()))

    top_features = sorted(
        shap_dict.items(),
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

    explication = generer_explication(decision, shap_features, client_dict)

    # Sauvegarder dans PostgreSQL
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


@router.get("/health")
def health():
    return {"status": "OK", "model_loaded": model is not None}