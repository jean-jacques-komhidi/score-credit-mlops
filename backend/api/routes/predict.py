from fastapi import APIRouter, HTTPException
from api.schemas.client import ClientData, PredictionResponse
import pickle
import numpy as np
import pandas as pd

router = APIRouter()

# Chargement du modèle et des colonnes
try:
    with open('notebooks/models/best_xgb.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('notebooks/models/feature_columns.pkl', 'rb') as f:
        feature_columns = pickle.load(f)
    print("✅ Modèle et colonnes chargés avec succès !")
except Exception as e:
    print(f"⚠️ Erreur chargement : {e}")
    model = None
    feature_columns = []

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

@router.post("/predict", response_model=PredictionResponse)
def predict(client: ClientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Modèle non disponible")

    # Créer un DataFrame avec toutes les colonnes à 0 par défaut
    data = pd.DataFrame(0, index=[0], columns=feature_columns)

    # Remplir avec les données du client
    client_dict = client.dict()
    for col, val in client_dict.items():
        if col in data.columns:
            data[col] = val

    # Features engineerées
    data['AGE_YEARS'] = abs(client.DAYS_BIRTH) // 365
    data['YEARS_EMPLOYED'] = abs(client.DAYS_EMPLOYED) / 365
    data['CREDIT_INCOME_RATIO'] = client.AMT_CREDIT / client.AMT_INCOME_TOTAL
    data['ANNUITY_INCOME_RATIO'] = client.AMT_ANNUITY / client.AMT_INCOME_TOTAL
    data['CREDIT_GOODS_RATIO'] = client.AMT_CREDIT / client.AMT_GOODS_PRICE
    data['CREDIT_DURATION'] = client.AMT_CREDIT / client.AMT_ANNUITY
    data['DAYS_EMPLOYED_ANOMALY'] = 1 if client.DAYS_EMPLOYED == 0 else 0

    # Prédiction
    proba = model.predict_proba(data)[0][1]
    prediction = int(proba >= 0.5)
    score = COUT_FN * prediction + COUT_FP * (1 - prediction)

    return PredictionResponse(
        score=round(float(proba), 4),
        probabilite_defaut=round(float(proba) * 100, 2),
        decision="REFUSÉ" if prediction == 1 else "ACCORDÉ",
        niveau_risque=calculer_niveau_risque(proba),
        score_metier=float(score)
    )

@router.get("/health")
def health():
    return {"status": "OK", "model_loaded": model is not None}