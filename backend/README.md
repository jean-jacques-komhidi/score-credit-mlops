# 🏦 Backend — Score Crédit MLOps

## Description
API de scoring crédit basée sur un pipeline multi-modèles entraîné sur le dataset **Home Credit Default Risk** (Kaggle).
Ce backend couvre l'intégralité du cycle MLOps : préparation des données, entraînement automatique, réentraînement multi-modèles avec versioning, tracking MLFlow et exposition via une API REST FastAPI.

## Stack technique
| Outil | Rôle |
|-------|------|
| Python 3.11 | Langage principal |
| FastAPI | API REST |
| MLFlow 3.14 | Tracking et versioning des modèles |
| PostgreSQL | Backend MLFlow + stockage des données |
| Scikit-learn | Modèles de classification |
| XGBoost | Modèle de scoring (meilleure performance initiale) |
| RandomForest | Modèle de scoring (meilleure performance après réentraînement) |
| SHAP | Explicabilité des prédictions |
| LIME | Explicabilité locale des prédictions |
| Evidently | Détection du data drift |
| Pandas / NumPy | Manipulation des données |
| imbalanced-learn | Rééquilibrage (SMOTE) |
| SQLAlchemy | ORM pour PostgreSQL |

## Structure du projet
```
backend/
├── data/
│   ├── application_train.csv          # Dataset brut (non versionné)
│   └── rapport_drift.html             # Rapport Evidently Data Drift
├── notebooks/
│   ├── 01_preparation_donnees.ipynb   # Nettoyage, feature engineering, SMOTE
│   ├── 02_score_metier.ipynb          # Définition du score métier FP/FN
│   ├── 03_entrainement_modeles.ipynb  # Entraînement, comparaison, SHAP
│   └── 04_data_drift.ipynb            # Analyse du data drift
├── notebooks/models/
│   ├── best_xgb.pkl                   # Meilleur modèle en production
│   ├── feature_columns.pkl            # Colonnes du modèle (178 features)
│   ├── feature_medians.pkl            # Médianes pour imputation
│   ├── model_version.json             # Versioning du modèle (ex: 1.0.3)
│   ├── X_train.pkl                    # Données d'entraînement
│   ├── X_test.pkl                     # Données de test
│   ├── y_train.pkl                    # Labels d'entraînement
│   └── y_test.pkl                     # Labels de test
├── api/
│   ├── main.py                        # Point d'entrée FastAPI
│   ├── routes/
│   │   ├── predict.py                 # Routes prédiction + monitoring + clients
│   │   └── retrain.py                 # Pipeline réentraînement multi-modèles
│   └── schemas/
│       └── client.py                  # Schémas Pydantic
├── .env                               # Variables d'environnement
├── etl.py                             # Import CSV → PostgreSQL
├── seed_test_data.py                  # Injection de données de test
├── test_mlflow.py                     # Test de journalisation MLFlow
├── requirements.txt                   # Dépendances Python
└── README.md                          # Ce fichier
```

## Architecture des bases de données
```
PostgreSQL
├── mlflow_db        ← MLFlow (runs, métriques, expériences)
└── score_credit_db  ← Données métier
    ├── application_train  ← Dataset original (307k lignes)
    ├── predictions        ← Historique des prédictions en production
    ├── clients            ← Gestion des clients (CRUD)
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

### 6. Injecter les données de test
```bash
python seed_test_data.py --reset
```

### 7. Lancer MLFlow
```bash
mlflow server --backend-store-uri postgresql://postgres:motdepasse@localhost:5432/mlflow_db --default-artifact-root mlflow-artifacts: --host 127.0.0.1 --port 5000
```

### 8. Lancer l'API
```bash
uvicorn api.main:app --reload --port 8000
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/health` | Statut du modèle |
| POST | `/api/predict` | Prédiction + SHAP + LIME + Explication naturelle |
| GET | `/api/historique` | Historique paginé des prédictions (infinite scroll) |
| GET | `/api/stats` | Statistiques globales + nombre de clients |
| GET | `/api/mlflow-runs` | Runs MLFlow (dédupliqués par modèle) |
| GET | `/api/drift-stats` | Analyse du data drift (Z-score) |
| GET | `/api/actions-log` | Historique des actions système |
| POST | `/api/clients` | Créer un client |
| GET | `/api/clients` | Lister / rechercher des clients |
| GET | `/api/clients/{id}` | Détail client + historique analyses |
| PUT | `/api/clients/{id}` | Modifier un client |
| DELETE | `/api/clients/{id}` | Supprimer un client |
| POST | `/api/retrain` | Lancer le réentraînement multi-modèles |
| GET | `/api/retrain/status` | Statut et progression du réentraînement |

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
  "CODE_GENDER_M": 0,
  "client_id": 1
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
      "feature": "EXT_SOURCE_2",
      "impact": -0.42,
      "direction": "protection"
    }
  ],
  "lime_features": [
    {
      "feature": "EXT_SOURCE_2",
      "label": "Score de solvabilité externe 2",
      "impact": -0.12,
      "direction": "protection"
    }
  ],
  "explication": "✅ Le crédit a été accordé grâce aux facteurs suivants..."
}
```

## Pipeline de réentraînement MLOps

Le pipeline de réentraînement automatique compare **4 algorithmes** et déploie le meilleur :

```
Données initiales (application_train) + Données production (predictions 90j)
                          ↓
                    Encodage + SMOTE
                          ↓
        ┌──────────────────────────────────┐
        │  XGBoost │ RandomForest │ LR │ Dummy │
        └──────────────────────────────────┘
                          ↓
              Comparaison AUC-ROC + Score métier
                          ↓
          Meilleur modèle → best_xgb.pkl + versioning
                          ↓
              Rechargement en mémoire (sans redémarrage)
                          ↓
                    Log dans MLFlow
```

### Versioning automatique
- Version stockée dans `model_version.json`
- Format : `MAJEUR.MINEUR.PATCH` (ex: `1.0.3`)
- Incrémentation automatique à chaque amélioration
- Backup de l'ancien modèle : `best_xgb_v1.0.2_YYYYMMDD_HHMM.pkl`

## Résultats des modèles

### Entraînement initial
| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.7154 | 48 534 |
| Random Forest | 0.6953 | 46 864 |
| **XGBoost** ✅ | **0.7294** | **35 289** |

### Après réentraînement (données initiales + production)
| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.6870 | 254 221 |
| XGBoost | 0.7769 | 130 423 |
| **RandomForest** ✅ | **0.8273** | **4 400** |

## Score Métier
Dans le contexte du scoring crédit :
- **Faux Négatif (FN)** : accorder un crédit à un mauvais payeur → coût = 10
- **Faux Positif (FP)** : refuser un crédit à un bon payeur → coût = 1
- **Formule** : `Score = (10 × FN) + (1 × FP)` — à minimiser

## Analyse Data Drift (Z-score)
La détection du drift utilise le **Z-score statistique** :
- `Z = |moyenne_production - moyenne_référence| / écart_type_référence`
- **Z ≤ 1** → NORMAL — Distribution normale
- **1 < Z ≤ 2** → ALERTE — Dérive modérée
- **Z > 2** → CRITIQUE — Dérive significative, réentraînement recommandé

| Feature | Référence | Std | Z-score | Statut |
|---------|-----------|-----|---------|--------|
| Revenu annuel | 168 798 FCFA | 237 123 | 1.36 | 🟡 ALERTE |
| Montant crédit | 599 026 FCFA | 402 491 | 0.77 | 🟢 NORMAL |
| Mensualité | 27 109 FCFA | 14 494 | 1.55 | 🟡 ALERTE |

## Gestion des clients
La table `clients` permet de lier chaque analyse à un client identifié :
- Numéro client auto-généré (format `CLT-0001`)
- Recherche par nom, prénom, numéro ou email
- Historique complet des analyses par client
- Actions CRUD complètes (créer, lire, modifier, supprimer)

## Étapes MLOps complétées
- [x] Étape 1 — Environnement MLFlow + PostgreSQL
- [x] Étape 2 — Préparation des données (SMOTE, feature engineering)
- [x] Étape 3 — Score métier (FP/FN)
- [x] Étape 4 — Entraînement et comparaison des modèles + SHAP + LIME
- [x] Étape 5 — Déploiement API FastAPI (15 endpoints)
- [x] Étape 6 — Interface React + Dashboard responsive
- [x] Étape 7 — Data Drift (Z-score) + Evidently
- [x] Étape 8 — Réentraînement automatique multi-modèles + versioning
- [x] Étape 9 — Gestion clients CRUD + liaison analyses
- [x] Bonus — CI/CD GitHub Actions

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026