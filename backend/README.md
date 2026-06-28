# 🏦 Backend — Score Crédit MLOps

## Description
API de scoring crédit basée sur un modèle XGBoost entraîné sur le dataset **Home Credit Default Risk** (Kaggle).
Ce backend couvre l'intégralité du cycle MLOps : préparation des données, entraînement, tracking MLFlow et exposition via une API REST FastAPI.

## Stack technique
| Outil | Rôle |
|-------|------|
| Python 3.11 | Langage principal |
| FastAPI | API REST |
| MLFlow 3.14 | Tracking et versioning des modèles |
| PostgreSQL | Backend MLFlow + stockage des données |
| Scikit-learn | Modèles de classification |
| XGBoost | Modèle de scoring (meilleure performance) |
| SHAP | Explicabilité des prédictions |
| Evidently | Détection du data drift |
| Pandas / NumPy | Manipulation des données |
| imbalanced-learn | Rééquilibrage (SMOTE) |
| SQLAlchemy | ORM pour PostgreSQL |

## Structure du projet
```
backend/
├── data/
│   ├── application_train.csv      # Dataset brut (non versionné)
│   └── rapport_drift.html         # Rapport Evidently Data Drift
├── notebooks/
│   ├── 01_preparation_donnees.ipynb   # Nettoyage, feature engineering, SMOTE
│   ├── 02_score_metier.ipynb          # Définition du score métier FP/FN
│   ├── 03_entrainement_modeles.ipynb  # Entraînement, comparaison, SHAP
│   └── 04_data_drift.ipynb            # Analyse du data drift
├── models/
│   ├── best_xgb.pkl               # Modèle XGBoost (meilleur)
│   ├── feature_columns.pkl        # Colonnes du modèle
│   ├── X_train.pkl                # Données d'entraînement
│   ├── X_test.pkl                 # Données de test
│   ├── y_train.pkl                # Labels d'entraînement
│   └── y_test.pkl                 # Labels de test
├── api/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── routes/
│   │   └── predict.py             # Routes de prédiction + monitoring
│   └── schemas/
│       └── client.py              # Schémas Pydantic
├── .env                           # Variables d'environnement
├── etl.py                         # Import CSV → PostgreSQL
├── test_mlflow.py                 # Test de journalisation MLFlow
├── requirements.txt               # Dépendances Python
└── README.md                      # Ce fichier
```

## Architecture des bases de données
```
PostgreSQL
├── mlflow_db        ← MLFlow (runs, métriques, expériences)
└── score_credit_db  ← Données métier
    ├── application_train  ← Dataset original (307k lignes)
    ├── predictions        ← Historique des prédictions en production
    └── actions_log        ← Historique des actions système
```

## Installation

### 1. Prérequis
- Python 3.11
- PostgreSQL
- pip

### 2. Créer l'environnement virtuel
```bash
py -3.11 -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac
```

### 3. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 4. Configurer le fichier .env
```env
MLFLOW_TRACKING_URI=http://127.0.0.1:5000
MLFLOW_BACKEND_STORE=postgresql://postgres:motdepasse@localhost:5432/mlflow_db
MLFLOW_ARTIFACT_ROOT=mlflow-artifacts:
```

### 5. Importer les données
```bash
python etl.py
```

### 6. Lancer MLFlow
```bash
mlflow server --backend-store-uri postgresql://postgres:motdepasse@localhost:5432/mlflow_db --default-artifact-root mlflow-artifacts: --host 127.0.0.1 --port 5000
```

### 7. Lancer l'API
```bash
uvicorn api.main:app --reload --port 8000
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/health` | Statut du modèle |
| POST | `/api/predict` | Prédiction + SHAP + Explication naturelle |
| GET | `/api/historique` | Historique des prédictions |
| GET | `/api/stats` | Statistiques globales |
| GET | `/api/mlflow-runs` | Runs MLFlow (dédupliqués par modèle) |
| GET | `/api/drift-stats` | Analyse du data drift |
| GET | `/api/actions-log` | Historique des actions système |

### Documentation interactive
👉 http://127.0.0.1:8000/docs

### Exemple de requête
```json
{
  "AMT_INCOME_TOTAL": 150000,
  "AMT_CREDIT": 500000,
  "AMT_ANNUITY": 25000,
  "AMT_GOODS_PRICE": 450000,
  "DAYS_BIRTH": -12000,
  "DAYS_EMPLOYED": -2000,
  "EXT_SOURCE_2": 0.6,
  "EXT_SOURCE_3": 0.5,
  "CNT_CHILDREN": 1,
  "CNT_FAM_MEMBERS": 3,
  "NAME_CONTRACT_TYPE": 0,
  "FLAG_OWN_CAR": 1,
  "FLAG_OWN_REALTY": 1,
  "CODE_GENDER_M": 0
}
```

### Exemple de réponse
```json
{
  "score": 0.1725,
  "probabilite_defaut": 17.25,
  "decision": "ACCORDÉ",
  "niveau_risque": "FAIBLE",
  "score_metier": 1.0,
  "shap_features": [
    {
      "feature": "NAME_EDUCATION_TYPE_Secondary / secondary special",
      "impact": -0.57,
      "direction": "protection"
    }
  ],
  "explication": "✅ Le crédit a été accordé grâce aux facteurs suivants..."
}
```

## Résultats des modèles

| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.7154 | 48 534 |
| Random Forest | 0.6953 | 46 864 |
| **XGBoost** ✅ | **0.7294** | **35 289** |

**XGBoost** est le modèle retenu pour la production.

## Score Métier
Dans le contexte du scoring crédit :
- **Faux Négatif (FN)** : accorder un crédit à un mauvais payeur → coût = 10
- **Faux Positif (FP)** : refuser un crédit à un bon payeur → coût = 1
- **Formule** : `Score = (10 × FN) + (1 × FP)` — à minimiser

## Top Features SHAP
1. Niveau d'études secondaires (-57.0% — réduit le risque)
2. Téléphone professionnel (+54.9% — augmente le risque)
3. Type de revenu : Salarié (-45.7% — réduit le risque)
4. Densité de population régionale (-42.6% — réduit le risque)
5. Demandes bureau crédit (1 an) (-42.4% — réduit le risque)

## Analyse Data Drift
| Feature | Référence | Production | Écart | Statut |
|---------|-----------|------------|-------|--------|
| Revenu annuel | 167 652 FCFA | 150 000 FCFA | 10.5% | 🟢 NORMAL |
| Montant crédit | 595 257 FCFA | 500 000 FCFA | 16.0% | 🟢 NORMAL |
| Mensualité | 26 987 FCFA | 25 000 FCFA | 7.4% | 🟢 NORMAL |

## Logging des actions
Chaque prédiction est automatiquement loggée dans la table `actions_log` avec :
- Type d'action (prediction, drift, modèle)
- Titre et message descriptif
- Statut (success, warning, error, info)
- Date et heure

## Étapes MLOps complétées
- [x] Étape 1 — Environnement MLFlow + PostgreSQL
- [x] Étape 2 — Préparation des données (SMOTE, feature engineering)
- [x] Étape 3 — Score métier (FP/FN)
- [x] Étape 4 — Entraînement et comparaison des modèles + SHAP
- [x] Étape 5 — Déploiement API FastAPI (8 endpoints)
- [x] Étape 6 — Interface React + Dashboard
- [x] Étape 7 — Data Drift + Evidently
- [x] Bonus — CI/CD GitHub Actions

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026