# 🏦 Score Crédit — Projet MLOps Complet

## Description
Projet MLOps complet de scoring crédit (risque de défaut de paiement).
Ce projet couvre l'intégralité du cycle de vie d'un modèle ML : de la préparation
des données jusqu'au déploiement en production avec monitoring du data drift.

## Dataset
**Home Credit Default Risk** (Kaggle)
- ~307 000 clients
- 122 features
- Cible binaire : `TARGET` (1 = défaut de paiement, 0 = remboursement normal)
- Déséquilibre : 91.9% classe 0 / 8.1% classe 1

## Architecture du projet
```
Score_Credit/
├── backend/                    ← API FastAPI + modèles ML + MLFlow
│   ├── data/
│   │   ├── application_train.csv
│   │   └── rapport_drift.html
│   ├── notebooks/
│   │   ├── 01_preparation_donnees.ipynb
│   │   ├── 02_score_metier.ipynb
│   │   ├── 03_entrainement_modeles.ipynb
│   │   └── 04_data_drift.ipynb
│   ├── models/
│   │   ├── best_xgb.pkl
│   │   └── feature_columns.pkl
│   ├── api/
│   │   ├── main.py
│   │   ├── routes/predict.py
│   │   └── schemas/client.py
│   ├── etl.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                   ← Interface React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── ci.yml             ← CI/CD GitHub Actions
│
├── .gitignore
└── README.md                  ← Ce fichier
```

## Architecture technique
```
┌─────────────────────────────────────────────┐
│                FRONTEND                      │
│  React + Vite + Tailwind + Lucide           │
│  Dashboard | Analyse | Monitoring           │
└──────────────────┬──────────────────────────┘
                   │ HTTP (Axios)
                   ▼
┌─────────────────────────────────────────────┐
│                BACKEND                       │
│  FastAPI + Uvicorn                          │
│  /predict | /historique | /stats           │
│  /mlflow-runs | /drift-stats               │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌─────────────────────┐
│   MLFlow     │    │    PostgreSQL        │
│   Port 5000  │    │  mlflow_db          │
│   Tracking   │    │  score_credit_db    │
│   Runs       │    │  - application_train│
│   Métriques  │    │  - predictions      │
└──────────────┘    └─────────────────────┘
```

## Lancer le projet

### Backend
```bash
cd backend
venv\Scripts\activate

# Terminal 1 — MLFlow
mlflow server --backend-store-uri postgresql://postgres:motdepasse@localhost:5432/mlflow_db --default-artifact-root mlflow-artifacts: --host 127.0.0.1 --port 5000

# Terminal 2 — API FastAPI
uvicorn api.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### Accès
| Service | URL |
|---------|-----|
| Frontend React | http://localhost:5173 |
| API FastAPI | http://localhost:8000 |
| Documentation API | http://localhost:8000/docs |
| MLFlow UI | http://localhost:5000 |

## Étapes MLOps

| Étape | Description | Statut |
|-------|-------------|--------|
| **Étape 1** | MLFlow + PostgreSQL | ✅ |
| **Étape 2** | Préparation données (SMOTE) | ✅ |
| **Étape 3** | Score métier FP/FN | ✅ |
| **Étape 4** | Entraînement + SHAP | ✅ |
| **Étape 5** | API FastAPI déployée | ✅ |
| **Étape 6** | Interface React | ✅ |
| **Étape 7** | Data Drift + Evidently | ✅ |
| **Bonus** | CI/CD GitHub Actions | ✅ |

## Résultats des modèles

| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.7154 | 48 534 |
| Random Forest | 0.6953 | 46 864 |
| **XGBoost** ✅ | **0.7294** | **35 289** |

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026
