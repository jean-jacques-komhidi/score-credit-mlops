# 🏦 Score Crédit — Projet MLOps Complet

## Description
Projet MLOps complet de scoring crédit (risque de défaut de paiement).
Ce projet couvre l'intégralité du cycle de vie d'un modèle ML : de la préparation
des données jusqu'au déploiement en production avec monitoring du data drift.

[![CI/CD](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml/badge.svg)](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml)

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
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── ScoreForm.jsx
│   │   │   ├── ScoreResult.jsx
│   │   │   └── ShapChart.jsx
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analyse.jsx
│   │   │   └── Monitoring.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── ci.yml             ← CI/CD GitHub Actions ✅
│
├── .gitignore
└── README.md                  ← Ce fichier
```

## Architecture technique
```
┌─────────────────────────────────────────────┐
│                FRONTEND                      │
│  React + Vite + Tailwind + Lucide React     │
│  Dashboard | Analyse | Monitoring           │
│  Mode jour/nuit | SHAP explicatif           │
└──────────────────┬──────────────────────────┘
                   │ HTTP (Axios)
                   ▼
┌─────────────────────────────────────────────┐
│                BACKEND                       │
│  FastAPI + Uvicorn (Port 8000)             │
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
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

# Terminal 1 — MLFlow
mlflow server --backend-store-uri postgresql://postgres:postgres123@localhost:5432/mlflow_db --default-artifact-root 
mlflow-artifacts: --host 127.0.0.1 --port 5000

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
| **Étape 4** | Entraînement XGBoost + SHAP | ✅ |
| **Étape 5** | API FastAPI déployée | ✅ |
| **Étape 6** | Interface React 3 pages | ✅ |
| **Étape 7** | Data Drift + Evidently | ✅ |
| **Bonus** | CI/CD GitHub Actions | ✅ |

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
1. Niveau d'études secondaires (57.0%)
2. Téléphone professionnel (54.9%)
3. Type de revenu : Salarié (45.7%)
4. Densité de population régionale (42.6%)
5. Demandes bureau crédit (1 an) (42.4%)

## Analyse Data Drift
| Feature | Référence | Production | Écart | Statut |
|---------|-----------|------------|-------|--------|
| Revenu annuel | 167 652 FCFA | 150 000 FCFA | 10.5% | 🟢 NORMAL |
| Montant crédit | 595 257 FCFA | 500 000 FCFA | 16.0% | 🟢 NORMAL |
| Mensualité | 26 987 FCFA | 25 000 FCFA | 7.4% | 🟢 NORMAL |

## CI/CD Pipeline
```
Push sur main
     │
     ▼
┌────────────────┐   ┌──────────────────┐
│ Test Backend   │   │ Test Frontend    │
│ - FastAPI OK   │   │ - npm install    │
│ - XGBoost OK   │   │ - npm run build  │
│ - Pandas OK    │   │ - Build OK       │
│ - SHAP OK      │   │                  │
└───────┬────────┘   └────────┬─────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        ┌──────────────────┐
        │ Deploy Notify    │
        │ ✅ Succès !      │
        └──────────────────┘
```

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026
