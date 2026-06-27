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

## Structure du projet
```
backend/
├── data/
│   └── application_train.csv      # Dataset brut (non versionné)
├── notebooks/
│   ├── 01_preparation_donnees.ipynb   # Nettoyage, feature engineering, SMOTE
│   ├── 02_score_metier.ipynb          # Définition du score métier FP/FN
│   └── 03_entrainement_modeles.ipynb  # Entraînement, comparaison, SHAP
├── models/
│   ├── X_train.pkl                # Données d'entraînement
│   ├── X_test.pkl                 # Données de test
│   ├── y_train.pkl                # Labels d'entraînement
│   ├── y_test.pkl                 # Labels de test
│   ├── X_train_smote.pkl          # Données rééquilibrées (SMOTE)
│   └── y_train_smote.pkl          # Labels rééquilibrés
├── api/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── routes/                    # Routes de l'API
│   └── schemas/                   # Schémas Pydantic
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
└── score_credit_db  ← Données métier (application_train)
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
uvicorn api.main:app --reload
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

## Top Features (SHAP)
1. NAME_INCOME_TYPE_Working (16.3%)
2. NAME_EDUCATION_TYPE_Secondary (13.0%)
3. EXT_SOURCE_3 (12.3%)
4. NAME_INCOME_TYPE_Commercial associate (11.7%)
5. EXT_SOURCE_2 (9.1%)

## API FastAPI

### Lancer l'API
```bash
cd backend
venv\Scripts\activate
uvicorn api.main:app --reload --port 8000
```

### Endpoints
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/health` | Statut du modèle |
| POST | `/api/predict` | Prédiction du score de crédit |

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
  "score_metier": 1.0
}
```

## Étapes MLOps complétées
- [x] Étape 1 — Environnement MLFlow + PostgreSQL
- [x] Étape 2 — Préparation des données
- [x] Étape 3 — Score métier
- [x] Étape 4 — Entraînement et comparaison des modèles
- [x] Étape 5 — Déploiement API FastAPI
- [ ] Étape 6 — Interface React
- [ ] Étape 7 — Data drift + soutenance

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA