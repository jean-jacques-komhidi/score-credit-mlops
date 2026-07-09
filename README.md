# Score Crédit — Projet MLOps Complet

**Système de Scoring Crédit avec Cycle de Vie ML de Bout en Bout**

Plateforme MLOps complète de scoring crédit (prédiction du risque de défaut de paiement). Le projet couvre l'intégralité du cycle de vie d'un modèle de Machine Learning : de la préparation des données à l'entraînement, jusqu'au déploiement en production, à l'explicabilité (SHAP) et au monitoring du data drift.

[![CI/CD](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml/badge.svg)](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Model-EB5E28?style=flat-square)]()
[![MLflow](https://img.shields.io/badge/MLflow-Tracking-0194E2?style=flat-square&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Academic-lightgrey?style=flat-square)]()

---

## Table des matières

- [Contexte](#contexte)
- [Dataset](#dataset)
- [Stack technique](#stack-technique)
- [Étapes MLOps](#étapes-mlops)
- [Architecture technique](#architecture-technique)
- [Architecture du projet](#architecture-du-projet)
- [Résultats des modèles](#résultats-des-modèles)
- [Score métier](#score-métier)
- [Explicabilité SHAP](#explicabilité-shap)
- [Analyse Data Drift](#analyse-data-drift)
- [Fonctionnalités de l'interface](#fonctionnalités-de-linterface)
- [Installation](#installation)
- [Pipeline CI/CD](#pipeline-cicd)
- [Aperçu](#aperçu)
- [Auteur](#auteur)

---

## Contexte

| Élément | Détail |
|---------|--------|
| Nature | Projet MLOps complet — scoring crédit |
| Objectif | Prédire le risque de défaut de paiement d'un client |
| Institution | Master 2 — UCAO |
| Année | 2025 / 2026 |
| Périmètre | Préparation données → modélisation → API → interface → monitoring |
| Modèle retenu | XGBoost (AUC-ROC 0.7294) |

Le projet démontre la mise en œuvre d'une chaîne MLOps industrialisée : suivi d'expériences (MLflow), API de prédiction (FastAPI), interface d'analyse (React), explicabilité des décisions (SHAP), détection de dérive des données (Evidently) et intégration continue (GitHub Actions).

---

## Dataset

**Home Credit Default Risk** (Kaggle)

| Caractéristique | Valeur |
|-----------------|--------|
| Clients | ~307 000 |
| Features | 122 |
| Cible | `TARGET` binaire (1 = défaut, 0 = remboursement normal) |
| Déséquilibre de classes | 91.9% classe 0 / 8.1% classe 1 |

Le fort déséquilibre est traité par sur-échantillonnage **SMOTE** lors de la phase de préparation.

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| Backend & API | FastAPI, Uvicorn, Python 3.11 |
| Machine Learning | XGBoost, scikit-learn, imbalanced-learn (SMOTE) |
| Explicabilité | SHAP |
| Suivi d'expériences | MLflow (Tracking, Runs, Métriques) |
| Base de données | PostgreSQL 14 (`mlflow_db`, `score_credit_db`) |
| Monitoring | Evidently (data drift) |
| Frontend | React, Vite, Tailwind CSS, Lucide React, Chart.js |
| Communication | Axios (HTTP) |
| CI/CD | GitHub Actions |

---

## Étapes MLOps

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | MLflow + PostgreSQL | ✅ |
| 2 | Préparation des données (SMOTE) | ✅ |
| 3 | Score métier FP / FN | ✅ |
| 4 | Entraînement XGBoost + SHAP | ✅ |
| 5 | API FastAPI déployée | ✅ |
| 6 | Interface React (6 pages) | ✅ |
| 7 | Data Drift + Evidently | ✅ |
| Bonus | CI/CD GitHub Actions | ✅ |

---

## Architecture technique

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│   React + Vite + Tailwind + Lucide React     │
│   Dashboard · Analyse · Monitoring           │
│   Notifications · Profil · Paramètres        │
│   Mode jour/nuit · SHAP explicatif animé     │
│   Graphiques Chart.js animés                 │
└──────────────────┬──────────────────────────┘
                   │ HTTP (Axios)
                   ▼
┌─────────────────────────────────────────────┐
│                 BACKEND                      │
│   FastAPI + Uvicorn (Port 8000)              │
│   /predict · /historique · /stats            │
│   /mlflow-runs · /drift-stats                │
│   /drift-report · /actions-log               │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌─────────────────────┐
│    MLflow    │    │     PostgreSQL      │
│   Port 5000  │    │   mlflow_db         │
│   Tracking   │    │   score_credit_db   │
│   Runs       │    │   - predictions     │
│   Métriques  │    │   - actions_log     │
└──────────────┘    └─────────────────────┘
```

---

## Architecture du projet

```
Score_Credit/
├── backend/                    # API FastAPI + modèles ML + MLflow
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
│   │   ├── feature_columns.pkl
│   │   └── feature_medians.pkl
│   ├── api/
│   │   ├── main.py
│   │   ├── routes/predict.py
│   │   └── schemas/client.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                   # Interface React + Tailwind
│   ├── src/
│   │   ├── components/          # Header, Sidebar, MetricCard,
│   │   │                        # ScoreForm, ScoreResult, ShapChart
│   │   ├── context/             # ThemeContext, UserContext,
│   │   │                        # NotificationsContext
│   │   ├── pages/               # Dashboard, Analyse, Monitoring,
│   │   │                        # Notifications, Profil, Parametres
│   │   └── services/api.js
│   ├── package.json
│   └── README.md
│
├── docs/screenshots/           # Captures d'écran de l'interface
│
├── .github/workflows/ci.yml    # CI/CD GitHub Actions
├── .gitignore
└── README.md
```

---

## Architecture technique
```
┌─────────────────────────────────────────────┐
│                FRONTEND                      │
│  React + Vite + Tailwind + Lucide React     │
│  Dashboard | Analyse | Monitoring           │
│  Notifications | Profil | Paramètres        │
│  Mode jour/nuit | SHAP explicatif animé     │
│  Graphiques Chart.js avec animations        │
└──────────────────┬──────────────────────────┘
                   │ HTTP (Axios)
                   ▼
┌─────────────────────────────────────────────┐
│                BACKEND                       │
│  FastAPI + Uvicorn (Port 8000)             │
│  /predict | /historique | /stats           │
│  /mlflow-runs | /drift-stats               │
│  /drift-report | /actions-log              │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌─────────────────────┐
│   MLFlow     │    │    PostgreSQL        │
│   Port 5000  │    │  mlflow_db          │
│   Tracking   │    │  score_credit_db    │
│   Runs       │    │  - predictions      │
│   Métriques  │    │  - actions_log      │
└──────────────┘    └─────────────────────┘
```

---

## Lancer le projet

### Prérequis
- Python 3.11
- Node.js 18+
- PostgreSQL 14+
- MLFlow

### Backend
```bash
cd backend
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

# Terminal 1 — MLFlow
mlflow server \
  --backend-store-uri postgresql://postgres:postgres123@localhost:5432/mlflow_db \
  --default-artifact-root mlflow-artifacts: \
  --host 127.0.0.1 --port 5000
  
mlflow server --backend-store-uri postgresql://postgres:postgres123@localhost:5432/mlflow_db --default-artifact-root ./mlruns --host 127.0.0.1 --port 5000

# Terminal 2 — API FastAPI
uvicorn api.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Accès
| Service | URL |
|---------|-----|
| Frontend React | http://localhost:5173 |
| API FastAPI | http://localhost:8000 |
| Documentation API | http://localhost:8000/docs |
| MLFlow UI | http://localhost:5000 |

---

## Étapes MLOps

| Étape | Description | Statut |
|-------|-------------|--------|
| **Étape 1** | MLFlow + PostgreSQL | ✅ |
| **Étape 2** | Préparation données (SMOTE) | ✅ |
| **Étape 3** | Score métier FP/FN | ✅ |
| **Étape 4** | Entraînement XGBoost + SHAP | ✅ |
| **Étape 5** | API FastAPI déployée | ✅ |
| **Étape 6** | Interface React 6 pages | ✅ |
| **Étape 7** | Data Drift + Evidently | ✅ |
| **Bonus** | CI/CD GitHub Actions | ✅ |

---

## Résultats des modèles

| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.7154 | 48 534 |
| Random Forest | 0.6953 | 46 864 |
| **XGBoost** ✅ | **0.7294** | **35 289** |

**XGBoost** est le modèle retenu pour la mise en production : meilleur AUC-ROC et score métier le plus faible (donc coût minimisé).

---

## Score métier

Dans le contexte du scoring crédit, les deux types d'erreurs n'ont pas le même coût :

| Erreur | Signification | Coût |
|--------|---------------|------|
| **Faux Négatif (FN)** | Accorder un crédit à un mauvais payeur | 10 |
| **Faux Positif (FP)** | Refuser un crédit à un bon payeur | 1 |

**Formule** : `Score = (10 × FN) + (1 × FP)` — à **minimiser**.

Cette pondération asymétrique reflète le fait qu'un défaut de remboursement coûte bien plus cher à l'établissement qu'une opportunité manquée.

---

## Explicabilité SHAP

Les prédictions sont rendues interprétables via **SHAP**, qui quantifie la contribution de chaque variable à la décision.

| Rang | Feature | Importance |
|------|---------|-----------|
| 1 | Score de solvabilité externe 2 | 43.5% |
| 2 | Score de solvabilité externe 3 | 64.7% |
| 3 | Type de revenu : Salarié | 45.7% |
| 4 | Possession d'une voiture | 49.5% |
| 5 | Ancienneté professionnelle | 10.2% |

L'interface affiche un graphique SHAP animé pour chaque dossier analysé, permettant de justifier chaque décision d'octroi ou de refus.

---

## Analyse Data Drift

Le monitoring compare en continu la distribution des données de production à celle des données de référence (Evidently).

| Feature | Référence | Production | Écart | Statut |
|---------|-----------|------------|-------|--------|
| Revenu annuel | 167 652 FCFA | variable | < 20% | 🟢 NORMAL |
| Montant crédit | 595 257 FCFA | variable | < 20% | 🟢 NORMAL |
| Mensualité | 26 987 FCFA | variable | < 20% | 🟢 NORMAL |

Un rapport HTML complet est généré et consultable depuis la page Monitoring.

---

## Fonctionnalités de l'interface

| Page | Fonctionnalités |
|------|----------------|
| **Tableau de bord** | KPIs animés, histogramme, camembert, courbe d'évolution, historique |
| **Analyse** | Formulaire en 5 sections, résultat ACCORDÉ / REFUSÉ, SHAP animé |
| **Monitoring** | Runs MLflow, data drift Evidently, rapport HTML |
| **Notifications** | Historique des actions système en temps réel |
| **Paramètres** | Profil utilisateur, seuils de drift, configuration API |
| **Mode sombre** | Thème sombre complet sur l'ensemble des pages |

---

## Installation

### Prérequis

- Python 3.11
- Node.js 18 ou supérieur
- PostgreSQL 14 ou supérieur
- MLflow

### Backend

```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Terminal 1 — MLflow
mlflow server \
  --backend-store-uri postgresql://postgres:postgres123@localhost:5432/mlflow_db \
  --default-artifact-root mlflow-artifacts: \
  --host 127.0.0.1 --port 5000

# Terminal 2 — API FastAPI
uvicorn api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Accès aux services

| Service | URL |
|---------|-----|
| Frontend React | http://localhost:5173 |
| API FastAPI | http://localhost:8000 |
| Documentation API (Swagger) | http://localhost:8000/docs |
| MLflow UI | http://localhost:5000 |

---

## Pipeline CI/CD

À chaque push sur `main`, GitHub Actions exécute les tests backend et frontend en parallèle avant notification.

```
Push sur main
     │
     ▼
┌────────────────┐   ┌──────────────────┐
│  Test Backend  │   │  Test Frontend   │
│  - FastAPI OK  │   │  - npm install   │
│  - XGBoost OK  │   │  - npm run build │
│  - Pandas OK   │   │  - Build OK      │
│  - SHAP OK     │   │                  │
└───────┬────────┘   └────────┬─────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        ┌──────────────────┐
        │  Deploy Notify   │
        │  ✅ Succès !      │
        └──────────────────┘
```

---

## Aperçu

<table>
<tr>
<td width="50%"><b>Tableau de bord — KPIs et graphiques</b><br><img src="docs/screenshots/screenshot_dashboard.png" alt="Tableau de bord"></td>
<td width="50%"><b>Historique des analyses</b><br><img src="docs/screenshots/screenshot_historique.png" alt="Historique"></td>
</tr>
<tr>
<td><b>Analyse — Formulaire et résultat</b><br><img src="docs/screenshots/screenshot_analyse_formulaire.png" alt="Analyse formulaire"></td>
<td><b>Analyse — Explication SHAP</b><br><img src="docs/screenshots/screenshot_analyse_shap.png" alt="Analyse SHAP"></td>
</tr>
<tr>
<td><b>Graphique SHAP détaillé</b><br><img src="docs/screenshots/screenshot_analyse_shap2.png" alt="SHAP détaillé"></td>
<td><b>Notifications système</b><br><img src="docs/screenshots/screenshot_notifications.png" alt="Notifications"></td>
</tr>
<tr>
<td><b>Monitoring — Runs MLflow et Data Drift</b><br><img src="docs/screenshots/screenshot_monitoring.png" alt="Monitoring"></td>
<td><b>Paramètres — Profil utilisateur</b><br><img src="docs/screenshots/screenshot_parametres_profil.png" alt="Paramètres profil"></td>
</tr>
<tr>
<td><b>Paramètres — Seuils Data Drift</b><br><img src="docs/screenshots/screenshot_parametres_drift.png" alt="Paramètres drift"></td>
<td><b>Paramètres — Configuration API</b><br><img src="docs/screenshots/screenshot_parametres_api.png" alt="Paramètres API"></td>
</tr>
</table>

---

## Auteur

**KOMHIDI Jean-Jacques**
Master 2 — UCAO

- Encadrant : **AIDARA CHAMSEDINE** — Tech Lead Data & IA
- Année : 2025 / 2026
- GitHub : [jean-jacques-komhidi/score-credit-mlops](https://github.com/jean-jacques-komhidi/score-credit-mlops)

---

## License

Projet académique — usage pédagogique et démonstratif.
