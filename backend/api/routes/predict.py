import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from api.schemas.client import ClientData
import pickle
import numpy as np
import pandas as pd
import shap
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ─────────────────────────────────────────────
# CHARGEMENT DU MODÈLE, COLONNES, MÉDIANES, SHAP, LIME
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

    print("5️⃣ Chargement LIME...")
    from lime.lime_tabular import LimeTabularExplainer
    with open('notebooks/models/X_train.pkl', 'rb') as f:
        X_train_lime = pickle.load(f)
    X_train_sample = X_train_lime.sample(n=2000, random_state=42).values
    lime_explainer = LimeTabularExplainer(
        training_data=X_train_sample,
        feature_names=feature_columns,
        mode="classification",
        discretize_continuous=True
    )
    del X_train_lime
    print("✅ LIME OK")

except Exception as e:
    import traceback
    print(f"⚠️ Erreur chargement : {e}")
    traceback.print_exc()
    model = None
    feature_columns = []
    feature_medians = {}
    explainer = None
    lime_explainer = None


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
# CONSTANTES
# ─────────────────────────────────────────────
COUT_FN = 10
COUT_FP = 1
SEUIL_DECISION = 0.30

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

# Facteurs naturellement protecteurs — si SHAP les affiche en risque,
# c'est que leur effet positif est insuffisant face aux autres facteurs
FACTEURS_POSITIFS = {
    "FLAG_OWN_REALTY": "possession d'un bien immobilier",
    "FLAG_OWN_CAR":    "possession d'une voiture",
    "EXT_SOURCE_2":    "score de solvabilité externe 2",
    "EXT_SOURCE_3":    "score de solvabilité externe 3",
    "YEARS_EMPLOYED":  "ancienneté professionnelle",
    "AGE_YEARS":       "âge du client",
}

LIME_LABELS = {
    "EXT_SOURCE_2":       "Score de solvabilité externe 2",
    "EXT_SOURCE_3":       "Score de solvabilité externe 3",
    "AMT_INCOME_TOTAL":   "Revenu annuel",
    "AMT_CREDIT":         "Montant du crédit",
    "AMT_ANNUITY":        "Mensualité",
    "AMT_GOODS_PRICE":    "Prix du bien",
    "CNT_CHILDREN":       "Nombre d'enfants",
    "CNT_FAM_MEMBERS":    "Membres de la famille",
    "NAME_CONTRACT_TYPE": "Type de contrat",
    "FLAG_OWN_CAR":       "Possession d'une voiture",
    "FLAG_OWN_REALTY":    "Possession d'un bien immobilier",
    "CODE_GENDER_M":      "Genre",
    "AGE_YEARS":          "Âge du client",
    "YEARS_EMPLOYED":     "Ancienneté professionnelle",
    "CREDIT_INCOME_RATIO":  "Ratio crédit / revenu",
    "ANNUITY_INCOME_RATIO": "Ratio mensualité / revenu",
    "CREDIT_GOODS_RATIO":   "Ratio crédit / valeur du bien",
    "CREDIT_DURATION":      "Durée du crédit",
    "DAYS_EMPLOYED_ANOMALY":"Anomalie d'emploi",
}


# ─────────────────────────────────────────────
# SCHÉMAS PYDANTIC
# ─────────────────────────────────────────────
class ClientCreate(BaseModel):
    nom: str
    prenom: str
    date_naissance: Optional[str] = None
    telephone:      Optional[str] = None
    email:          Optional[str] = None
    adresse:        Optional[str] = None
    num_piece:      Optional[str] = None


# ─────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────
def calculer_niveau_risque(proba: float) -> str:
    if proba < 0.20:
        return "FAIBLE"
    elif proba < 0.35:
        return "MODÉRÉ"
    elif proba < 0.50:
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
                    "type":    type_action,
                    "titre":   titre,
                    "message": message,
                    "statut":  statut
                })
                conn.commit()
        except Exception as e:
            print(f"⚠️ Erreur log action : {e}")


def generer_explication(decision, shap_features, client_dict):
    labels = {
        "EXT_SOURCE_3":        "score de solvabilité externe 3",
        "EXT_SOURCE_2":        "score de solvabilité externe 2",
        "CREDIT_INCOME_RATIO": "ratio crédit/revenu",
        "ANNUITY_INCOME_RATIO":"ratio mensualité/revenu",
        "CREDIT_DURATION":     "durée du crédit",
        "CREDIT_GOODS_RATIO":  "ratio crédit/valeur du bien",
        "AGE_YEARS":           "âge du client",
        "YEARS_EMPLOYED":      "ancienneté professionnelle",
        "DAYS_EMPLOYED_ANOMALY":"situation d'emploi",
        "AMT_CREDIT":          "montant du crédit",
        "AMT_GOODS_PRICE":     "prix du bien",
        "AMT_INCOME_TOTAL":    "revenu annuel",
        "AMT_ANNUITY":         "mensualité",
        "CNT_CHILDREN":        "nombre d'enfants",
        "CODE_GENDER_M":       "genre",
        "FLAG_OWN_CAR":        "possession d'une voiture",
        "FLAG_OWN_REALTY":     "possession d'un bien immobilier",
        "NAME_CONTRACT_TYPE":  "type de contrat",
        "CNT_FAM_MEMBERS":     "nombre de membres de la famille",
    }

    risque     = [f for f in shap_features if f["direction"] == "risque"][:3]
    protection = [f for f in shap_features if f["direction"] == "protection"][:3]
    lignes     = []

    # ── Analyse contextuelle des données client ──
    revenu     = client_dict.get("AMT_INCOME_TOTAL", 0) or 0
    credit     = client_dict.get("AMT_CREDIT", 0) or 0
    annuite    = client_dict.get("AMT_ANNUITY", 0) or 0
    enfants    = client_dict.get("CNT_CHILDREN", 0) or 0
    age        = int(abs(client_dict.get("DAYS_BIRTH", -12000)) // 365) \
                 if "DAYS_BIRTH" in client_dict \
                 else (client_dict.get("AGE_YEARS", 0) or 0)
    anciennete = round(abs(client_dict.get("DAYS_EMPLOYED", -1825)) / 365, 1) \
                 if "DAYS_EMPLOYED" in client_dict \
                 else (client_dict.get("YEARS_EMPLOYED", 0) or 0)
    ext2       = client_dict.get("EXT_SOURCE_2", 0.5) or 0.5
    ext3       = client_dict.get("EXT_SOURCE_3", 0.5) or 0.5
    own_car    = client_dict.get("FLAG_OWN_CAR", 0)
    own_real   = client_dict.get("FLAG_OWN_REALTY", 0)

    ratio_credit_revenu  = credit / revenu  if revenu  > 0 else 0
    ratio_annuite_revenu = annuite / revenu if revenu  > 0 else 0

    # ── Alertes contextuelles ──
    alertes = []

    if ratio_credit_revenu > 5:
        alertes.append(
            f"Le montant du crédit ({int(credit):,} FCFA) représente plus de "
            f"{int(ratio_credit_revenu)}x votre revenu annuel ({int(revenu):,} FCFA) "
            f"— charge d'endettement très élevée."
        )
    elif ratio_credit_revenu > 3:
        alertes.append(
            f"Le montant du crédit représente {int(ratio_credit_revenu)}x "
            f"votre revenu annuel — ratio d'endettement élevé."
        )

    if ratio_annuite_revenu > 0.40:
        alertes.append(
            f"La mensualité ({int(annuite):,} FCFA) représente "
            f"{round(ratio_annuite_revenu*100)}% de votre revenu mensuel "
            f"— capacité de remboursement insuffisante."
        )

    if enfants >= 5:
        alertes.append(
            f"Charges familiales très importantes : {enfants} enfants à charge, "
            f"ce qui réduit significativement le revenu disponible pour le remboursement."
        )
    elif enfants >= 3:
        alertes.append(
            f"{enfants} enfants à charge — les dépenses familiales "
            f"réduisent le revenu disponible pour le remboursement."
        )

    if age < 25 and anciennete < 2:
        alertes.append(
            f"Profil junior : {age} ans avec {anciennete} an(s) d'ancienneté "
            f"— stabilité financière encore à consolider."
        )
    elif anciennete < 1:
        alertes.append(
            f"Ancienneté professionnelle faible ({anciennete} an) "
            f"— revenus potentiellement instables."
        )

    if not own_car and not own_real:
        alertes.append(
            "Absence totale de patrimoine (ni voiture ni bien immobilier) "
            "— aucune garantie matérielle disponible en cas de défaut."
        )

    if ext2 < 0.3 and ext3 < 0.3:
        alertes.append(
            f"Scores de solvabilité externes très faibles "
            f"(Score 2 : {ext2} / Score 3 : {ext3}) "
            f"— historique de crédit préoccupant."
        )
    elif ext2 < 0.4 or ext3 < 0.4:
        alertes.append(
            "Scores de solvabilité externes insuffisants "
            "— profil jugé risqué par les bureaux de crédit."
        )

    # ── Points positifs contextuels ──
    points_positifs = []

    if own_real:
        points_positifs.append("Possession d'un bien immobilier — atout patrimonial.")
    if own_car:
        points_positifs.append("Possession d'un véhicule — patrimoine mobilier disponible.")
    if ext2 >= 0.6:
        points_positifs.append(f"Bon score de solvabilité externe 2 ({ext2}).")
    if ext3 >= 0.6:
        points_positifs.append(f"Bon score de solvabilité externe 3 ({ext3}).")
    if anciennete >= 3:
        points_positifs.append(f"Bonne stabilité professionnelle ({anciennete} ans d'ancienneté).")
    if ratio_credit_revenu <= 3 and revenu > 0:
        points_positifs.append(
            f"Ratio crédit/revenu acceptable ({round(ratio_credit_revenu, 1)}x)."
        )
    if ratio_annuite_revenu <= 0.30 and revenu > 0:
        points_positifs.append(
            f"Mensualité raisonnable ({round(ratio_annuite_revenu*100)}% du revenu mensuel)."
        )

    # ── Construction de l'explication ──
    if decision == "REFUSÉ":
        lignes.append("❌ Le crédit a été refusé pour les raisons suivantes :\n")

        # Facteurs SHAP principaux — avec gestion des facteurs contre-intuitifs
        if risque:
            lignes.append("Facteurs déterminants identifiés par le modèle :")
            for f in risque:
                label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
                if f["feature"] in FACTEURS_POSITIFS:
                    lignes.append(
                        f"  • Votre {label} est un atout, mais il est insuffisant "
                        f"pour compenser les autres facteurs de risque de votre dossier."
                    )
                else:
                    lignes.append(
                        f"  • Votre {label} augmente significativement le risque de défaut."
                    )

        # Alertes contextuelles
        if alertes:
            lignes.append("\nAnalyse détaillée du dossier :")
            for alerte in alertes:
                lignes.append(f"  • {alerte}")

        # Points positifs
        if points_positifs:
            lignes.append("\n✨ Points positifs de votre dossier :")
            for point in points_positifs:
                lignes.append(f"  • {point}")

        # Recommandations personnalisées
        lignes.append("\n💡 Recommandations :")
        if ratio_credit_revenu > 3:
            lignes.append("  • Réduisez le montant du crédit demandé.")
        if ratio_annuite_revenu > 0.35:
            lignes.append("  • Allongez la durée du prêt pour réduire la mensualité.")
        if ext2 < 0.4 or ext3 < 0.4:
            lignes.append(
                "  • Améliorez votre score de solvabilité "
                "en régularisant vos dettes existantes."
            )
        if anciennete < 1:
            lignes.append(
                "  • Consolidez votre ancienneté professionnelle "
                "(minimum 1 an recommandé)."
            )
        if not lignes[-1].startswith("  •"):
            lignes.append(
                "  • Améliorez votre profil financier "
                "avant de renouveler la demande."
            )

    else:
        lignes.append("✅ Le crédit a été accordé grâce aux facteurs suivants :\n")

        # Points positifs contextuels
        if points_positifs:
            for point in points_positifs:
                lignes.append(f"  • {point}")

        # Facteurs SHAP de protection non déjà couverts
        if protection:
            for f in protection:
                label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
                if not any(label in p for p in points_positifs):
                    lignes.append(
                        f"  • Votre {label} rassure sur votre capacité de remboursement."
                    )

        # Points de vigilance
        if alertes or risque:
            lignes.append("\n⚠️ Points de vigilance à surveiller :")
            for alerte in alertes[:2]:
                lignes.append(f"  • {alerte}")
            for f in risque[:2]:
                label = labels.get(f["feature"], f["feature"].replace("_", " ").lower())
                if f["feature"] in FACTEURS_POSITIFS:
                    lignes.append(
                        f"  • Votre {label} est positif mais reste "
                        f"un facteur à surveiller dans votre profil global."
                    )
                else:
                    lignes.append(
                        f"  • Votre {label} reste un facteur de risque modéré."
                    )

    return "\n".join(lignes)


def construire_features(client: ClientData) -> pd.DataFrame:
    data = pd.DataFrame([feature_medians], columns=feature_columns)
    client_dict = client.dict()
    for col, val in client_dict.items():
        if col in data.columns:
            data[col] = val
    data['AGE_YEARS']            = abs(client.DAYS_BIRTH) // 365
    data['YEARS_EMPLOYED']       = abs(client.DAYS_EMPLOYED) / 365
    data['CREDIT_INCOME_RATIO']  = client.AMT_CREDIT / client.AMT_INCOME_TOTAL
    data['ANNUITY_INCOME_RATIO'] = client.AMT_ANNUITY / client.AMT_INCOME_TOTAL
    data['CREDIT_GOODS_RATIO']   = client.AMT_CREDIT / client.AMT_GOODS_PRICE
    data['CREDIT_DURATION']      = client.AMT_CREDIT / client.AMT_ANNUITY
    data['DAYS_EMPLOYED_ANOMALY']= 1 if client.DAYS_EMPLOYED == 0 else 0
    return data


# ─────────────────────────────────────────────
# ENDPOINT : PRÉDICTION
# ─────────────────────────────────────────────
@router.post("/predict")
def predict(client: ClientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Modèle non disponible")

    data  = construire_features(client)
    proba = model.predict_proba(data)[0][1]

    # Seuil optimisé — FN coûte 10x plus que FP
    prediction = int(proba >= SEUIL_DECISION)
    score      = COUT_FN * prediction + COUT_FP * (1 - prediction)
    decision   = "REFUSÉ" if prediction == 1 else "ACCORDÉ"

    # ── SHAP ──
    raw_shap = explainer.shap_values(data)

    if isinstance(raw_shap, list):
        shap_array = np.array(raw_shap[1][0])
    else:
        shap_array = np.array(raw_shap[0])

    if shap_array.ndim > 1:
        shap_array = shap_array.flatten()

    shap_dict   = dict(zip(feature_columns, shap_array.tolist()))
    top_features = sorted(
        [(f, v) for f, v in shap_dict.items() if f in CHAMPS_FORMULAIRE],
        key=lambda x: abs(float(x[1])), reverse=True
    )[:10]
    shap_features = [
        {
            "feature":   f,
            "impact":    round(float(v), 4),
            "direction": "risque" if v > 0 else "protection"
        }
        for f, v in top_features
    ]

    # ── LIME ──
    lime_features = []
    if lime_explainer is not None:
        try:
            lime_exp = lime_explainer.explain_instance(
                data_row=data.values[0],
                predict_fn=model.predict_proba,
                num_features=19,
                labels=(1,)
            )
            lime_raw = lime_exp.as_list(label=1)
            for feat_label, weight in lime_raw:
                matched_key   = None
                matched_label = None
                for key in CHAMPS_FORMULAIRE:
                    if key.lower() in feat_label.lower():
                        matched_key   = key
                        matched_label = LIME_LABELS.get(key, key)
                        break
                if matched_key is None:
                    continue
                lime_features.append({
                    "feature":   matched_key,
                    "label":     matched_label,
                    "impact":    round(weight, 4),
                    "direction": "risque" if weight > 0 else "protection"
                })
            lime_features = sorted(
                lime_features, key=lambda x: abs(x["impact"]), reverse=True
            )[:10]
        except Exception as e:
            print(f"⚠️ Erreur calcul LIME : {e}")

    explication = generer_explication(decision, shap_features, client.dict())
    client_id   = getattr(client, 'client_id', None)

    if db_engine:
        try:
            with db_engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO predictions
                    (revenu, credit, annuite, age, anciennete, decision,
                     probabilite_defaut, niveau_risque, score_metier, score, client_id)
                    VALUES (:revenu, :credit, :annuite, :age, :anciennete, :decision,
                            :probabilite_defaut, :niveau_risque, :score_metier, :score, :client_id)
                """), {
                    "revenu":            client.AMT_INCOME_TOTAL,
                    "credit":            client.AMT_CREDIT,
                    "annuite":           client.AMT_ANNUITY,
                    "age":               int(abs(client.DAYS_BIRTH) // 365),
                    "anciennete":        int(abs(client.DAYS_EMPLOYED) / 365),
                    "decision":          decision,
                    "probabilite_defaut":round(float(proba) * 100, 2),
                    "niveau_risque":     calculer_niveau_risque(proba),
                    "score_metier":      float(score),
                    "score":             round(float(proba), 4),
                    "client_id":         client_id
                })
                conn.commit()
                print("✅ Prédiction sauvegardée !")

            log_action(
                "prediction",
                "Nouvelle prédiction",
                f"Décision : {decision} — Probabilité : {round(float(proba)*100, 2)}% "
                f"— Risque : {calculer_niveau_risque(proba)}",
                "success" if decision == "ACCORDÉ" else "warning"
            )
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde : {e}")

    return {
        "score":             round(float(proba), 4),
        "probabilite_defaut":round(float(proba) * 100, 2),
        "decision":          decision,
        "niveau_risque":     calculer_niveau_risque(proba),
        "score_metier":      float(score),
        "shap_features":     shap_features,
        "lime_features":     lime_features,
        "explication":       explication
    }


# ─────────────────────────────────────────────
# ENDPOINT : CRÉER UN CLIENT
# ─────────────────────────────────────────────
@router.post("/clients")
def creer_client(client: ClientCreate):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM clients"))
            count  = result.fetchone()[0]
            numero_client = f"CLT-{str(count + 1).zfill(4)}"

            result = conn.execute(text("""
                INSERT INTO clients
                (numero_client, nom, prenom, date_naissance, telephone, email, adresse, num_piece)
                VALUES (:numero_client, :nom, :prenom, :date_naissance, :telephone, :email, :adresse, :num_piece)
                RETURNING id, numero_client, nom, prenom, date_naissance,
                          telephone, email, adresse, num_piece, date_creation
            """), {
                "numero_client": numero_client,
                "nom":           client.nom.upper(),
                "prenom":        client.prenom,
                "date_naissance":client.date_naissance,
                "telephone":     client.telephone,
                "email":         client.email,
                "adresse":       client.adresse,
                "num_piece":     client.num_piece,
            })
            row = result.fetchone()
            conn.commit()

            log_action(
                "client", "Nouveau client créé",
                f"Client {row[2]} {row[3]} — N° {row[1]}", "success"
            )
            return {
                "id": row[0], "numero_client": row[1], "nom": row[2], "prenom": row[3],
                "date_naissance": str(row[4]) if row[4] else None,
                "telephone": row[5], "email": row[6], "adresse": row[7],
                "num_piece": row[8],
                "date_creation": row[9].strftime("%Y-%m-%d %H:%M") if row[9] else None
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : RECHERCHER DES CLIENTS
# ─────────────────────────────────────────────
@router.get("/clients")
def rechercher_clients(q: Optional[str] = None, limit: int = 20):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            if q:
                result = conn.execute(text("""
                    SELECT id, numero_client, nom, prenom, date_naissance,
                           telephone, email, adresse, num_piece, date_creation
                    FROM clients
                    WHERE
                        LOWER(nom) LIKE LOWER(:q) OR
                        LOWER(prenom) LIKE LOWER(:q) OR
                        LOWER(numero_client) LIKE LOWER(:q) OR
                        LOWER(email) LIKE LOWER(:q) OR
                        telephone LIKE :q
                    ORDER BY date_creation DESC
                    LIMIT :limit
                """), {"q": f"%{q}%", "limit": limit})
            else:
                result = conn.execute(text("""
                    SELECT id, numero_client, nom, prenom, date_naissance,
                           telephone, email, adresse, num_piece, date_creation
                    FROM clients
                    ORDER BY date_creation DESC
                    LIMIT :limit
                """), {"limit": limit})

            rows = result.fetchall()
            return [
                {
                    "id": r[0], "numero_client": r[1], "nom": r[2], "prenom": r[3],
                    "date_naissance": str(r[4]) if r[4] else None,
                    "telephone": r[5], "email": r[6], "adresse": r[7],
                    "num_piece": r[8],
                    "date_creation": r[9].strftime("%Y-%m-%d %H:%M") if r[9] else None
                }
                for r in rows
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : DÉTAIL CLIENT + HISTORIQUE ANALYSES
# ─────────────────────────────────────────────
@router.get("/clients/{client_id}")
def detail_client(client_id: int):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, numero_client, nom, prenom, date_naissance,
                       telephone, email, adresse, num_piece, date_creation
                FROM clients WHERE id = :id
            """), {"id": client_id})
            row = result.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Client non trouvé")

            client_info = {
                "id": row[0], "numero_client": row[1], "nom": row[2], "prenom": row[3],
                "date_naissance": str(row[4]) if row[4] else None,
                "telephone": row[5], "email": row[6], "adresse": row[7],
                "num_piece": row[8],
                "date_creation": row[9].strftime("%Y-%m-%d %H:%M") if row[9] else None
            }

            result = conn.execute(text("""
                SELECT id, date_analyse, revenu, credit, annuite, age,
                       anciennete, decision, probabilite_defaut, niveau_risque,
                       score_metier, score
                FROM predictions
                WHERE client_id = :client_id
                ORDER BY date_analyse DESC
            """), {"client_id": client_id})
            analyses = result.fetchall()

            client_info["analyses"] = [
                {
                    "id": a[0], "date": a[1].strftime("%Y-%m-%d %H:%M"),
                    "revenu": a[2], "credit": a[3], "annuite": a[4],
                    "age": a[5], "anciennete": a[6],
                    "decision": a[7], "probabilite_defaut": a[8],
                    "niveau_risque": a[9], "score_metier": a[10], "score": a[11]
                }
                for a in analyses
            ]
            client_info["nb_analyses"]      = len(client_info["analyses"])
            client_info["derniere_decision"] = client_info["analyses"][0]["decision"] \
                                               if client_info["analyses"] else None
            return client_info

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : MODIFIER UN CLIENT
# ─────────────────────────────────────────────
@router.put("/clients/{client_id}")
def modifier_client(client_id: int, client: ClientCreate):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                UPDATE clients
                SET nom=:nom, prenom=:prenom, date_naissance=:date_naissance,
                    telephone=:telephone, email=:email, adresse=:adresse, num_piece=:num_piece
                WHERE id=:id
                RETURNING id, numero_client, nom, prenom, date_naissance,
                          telephone, email, adresse, num_piece, date_creation
            """), {
                "id": client_id, "nom": client.nom.upper(), "prenom": client.prenom,
                "date_naissance": client.date_naissance, "telephone": client.telephone,
                "email": client.email, "adresse": client.adresse, "num_piece": client.num_piece,
            })
            row = result.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Client non trouvé")
            conn.commit()
            log_action(
                "client", "Client modifié",
                f"Client {row[2]} {row[3]} — N° {row[1]}", "success"
            )
            return {
                "id": row[0], "numero_client": row[1], "nom": row[2], "prenom": row[3],
                "date_naissance": str(row[4]) if row[4] else None,
                "telephone": row[5], "email": row[6], "adresse": row[7],
                "num_piece": row[8],
                "date_creation": row[9].strftime("%Y-%m-%d %H:%M") if row[9] else None
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : SUPPRIMER UN CLIENT
# ─────────────────────────────────────────────
@router.delete("/clients/{client_id}")
def supprimer_client(client_id: int):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                DELETE FROM clients WHERE id=:id RETURNING id, nom, prenom
            """), {"id": client_id})
            row = result.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Client non trouvé")
            conn.commit()
            log_action("client", "Client supprimé", f"Client {row[2]} {row[1]}", "warning")
            return {"message": f"Client {row[2]} {row[1]} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : HISTORIQUE DES PRÉDICTIONS
# ─────────────────────────────────────────────
@router.get("/historique")
def historique(limit: int = 20, offset: int = 0):
    if db_engine is None:
        raise HTTPException(status_code=500, detail="DB non disponible")
    try:
        with db_engine.connect() as conn:
            count_result = conn.execute(text("SELECT COUNT(*) FROM predictions"))
            total = count_result.fetchone()[0]

            result = conn.execute(text("""
                SELECT p.id, p.date_analyse, p.revenu, p.credit, p.annuite, p.age,
                       p.anciennete, p.decision, p.probabilite_defaut,
                       p.niveau_risque, p.score_metier, p.score,
                       c.nom, c.prenom, c.numero_client
                FROM predictions p
                LEFT JOIN clients c ON p.client_id = c.id
                ORDER BY p.date_analyse DESC
                LIMIT :limit OFFSET :offset
            """), {"limit": limit, "offset": offset})
            rows = result.fetchall()
            return {
                "total":    total,
                "offset":   offset,
                "limit":    limit,
                "has_more": (offset + limit) < total,
                "items": [
                    {
                        "id": r[0], "date": r[1].strftime("%Y-%m-%d %H:%M"),
                        "revenu": r[2], "credit": r[3], "annuite": r[4],
                        "age": r[5], "anciennete": r[6],
                        "decision": r[7], "probabilite_defaut": r[8],
                        "niveau_risque": r[9], "score_metier": r[10], "score": r[11],
                        "client_nom": f"{r[13]} {r[12]}" if r[12] and r[13] else None,
                        "client_numero": r[14]
                    }
                    for r in rows
                ]
            }
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
                    SUM(CASE WHEN decision = 'REFUSÉ'  THEN 1 ELSE 0 END) as refuses,
                    ROUND(AVG(probabilite_defaut)::numeric, 2) as proba_moyenne
                FROM predictions
            """))
            row          = result.fetchone()
            total        = row[0] or 0
            accordes     = row[1] or 0
            refuses      = row[2] or 0
            proba_moyenne= float(row[3]) if row[3] else 0
            taux_accord  = round((accordes / total * 100), 1) if total > 0 else 0

            result2    = conn.execute(text("SELECT COUNT(*) FROM clients"))
            nb_clients = result2.fetchone()[0] or 0

            return {
                "total": total, "accordes": accordes, "refuses": refuses,
                "taux_accord": taux_accord, "proba_moyenne": proba_moyenne,
                "nb_clients": nb_clients
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
                modele = run.data.params.get("model",
                         run.data.params.get("best_model", "N/A"))
                auc    = run.data.metrics.get("auc_roc",
                         run.data.metrics.get("best_auc_roc", 0))
                score  = run.data.metrics.get("score_metier",
                         run.data.metrics.get("best_score_metier", 0))

                if auc > 0 and (modele not in seen_models or auc > seen_models[modele]["auc_roc"]):
                    seen_models[modele] = {
                        "run_id":      run.info.run_id[:8],
                        "nom":         run.data.tags.get("mlflow.runName", modele),
                        "modele":      modele,
                        "auc_roc":     round(auc, 4),
                        "score_metier":int(score) if score else None,
                        "statut":      "✅ Terminé"
                    }

        return sorted(seen_models.values(), key=lambda x: x["auc_roc"], reverse=True)

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
            ref_result = conn.execute(text("""
                SELECT
                    ROUND(AVG("AMT_INCOME_TOTAL")::numeric, 0) as moy_revenu,
                    ROUND(AVG("AMT_CREDIT")::numeric, 0)       as moy_credit,
                    ROUND(AVG("AMT_ANNUITY")::numeric, 0)      as moy_annuite,
                    ROUND(STDDEV("AMT_INCOME_TOTAL")::numeric, 0) as std_revenu,
                    ROUND(STDDEV("AMT_CREDIT")::numeric, 0)       as std_credit,
                    ROUND(STDDEV("AMT_ANNUITY")::numeric, 0)      as std_annuite
                FROM application_train
            """))
            ref_row  = ref_result.fetchone()

            prod_result = conn.execute(text("""
                SELECT AVG(revenu), AVG(credit), AVG(annuite), COUNT(*)
                FROM predictions
            """))
            prod_row = prod_result.fetchone()

        ref_stats = {
            "revenu":  {"mean": float(ref_row[0]) if ref_row[0] else 168798,
                        "std":  float(ref_row[3]) if ref_row[3] else 237123},
            "credit":  {"mean": float(ref_row[1]) if ref_row[1] else 599026,
                        "std":  float(ref_row[4]) if ref_row[4] else 402491},
            "annuite": {"mean": float(ref_row[2]) if ref_row[2] else 27109,
                        "std":  float(ref_row[5]) if ref_row[5] else 14494},
        }
        prod_stats = {
            "revenu":  float(prod_row[0]) if prod_row[0] else 0,
            "credit":  float(prod_row[1]) if prod_row[1] else 0,
            "annuite": float(prod_row[2]) if prod_row[2] else 0,
        }

        features = [
            {"feature": "Revenu annuel",  "key": "revenu"},
            {"feature": "Montant crédit", "key": "credit"},
            {"feature": "Mensualité",     "key": "annuite"},
        ]

        drift_results = []
        for f in features:
            key       = f["key"]
            ref_mean  = ref_stats[key]["mean"]
            ref_std   = ref_stats[key]["std"]
            prod_mean = prod_stats[key]
            z_score   = abs(prod_mean - ref_mean) / ref_std if ref_std > 0 else 0
            ecart_pct = abs(prod_mean - ref_mean) / ref_mean * 100 if ref_mean > 0 else 0
            statut    = "CRITIQUE" if z_score > 2 else "ALERTE" if z_score > 1 else "NORMAL"
            drift_results.append({
                "feature":   f["feature"],
                "ref_mean":  round(ref_mean, 0),
                "prod_mean": round(prod_mean, 0),
                "ecart_pct": round(ecart_pct, 1),
                "z_score":   round(z_score, 2),
                "statut":    statut
            })

        statut_global = (
            "CRITIQUE" if any(d["statut"] == "CRITIQUE" for d in drift_results) else
            "ALERTE"   if any(d["statut"] == "ALERTE"   for d in drift_results) else
            "NORMAL"
        )
        return {
            "total_predictions": int(prod_row[3]) if prod_row[3] else 0,
            "drift_features":    drift_results,
            "statut_global":     statut_global
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
                    "id": r[0], "date": r[1].strftime("%Y-%m-%d %H:%M"),
                    "type": r[2], "titre": r[3], "message": r[4], "statut": r[5]
                }
                for r in rows
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ENDPOINT : INFORMATIONS DU MODÈLE ACTIF
# ─────────────────────────────────────────────
@router.get("/model-info")
def model_info():
    try:
        with open("notebooks/models/model_version.json", "r") as f:
            return json.load(f)
    except:
        return {"version": "1.0.0", "model_name": "XGBoost", "auc_roc": 0.7294}


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