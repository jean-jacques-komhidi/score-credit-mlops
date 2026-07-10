# Score Crédit — Projet MLOps Complet

**Système de Scoring Crédit avec Cycle de Vie ML de Bout en Bout**

Plateforme MLOps complète de scoring crédit (prédiction du risque de défaut de paiement). Le projet couvre l'intégralité du cycle de vie d'un modèle de Machine Learning : de la préparation des données à l'entraînement, jusqu'au déploiement en production, à l'explicabilité (SHAP + LIME), au réentraînement automatique multi-modèles et au monitoring du data drift.

[![CI/CD](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml/badge.svg)](https://github.com/jean-jacques-komhidi/score-credit-mlops/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
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
- [Pipeline de réentraînement](#pipeline-de-réentraînement)
- [Analyse Data Drift](#analyse-data-drift)
- [Fonctionnalités de linterface](#fonctionnalités-de-linterface)
- [Installation](#installation)
- [Pipeline CICD](#pipeline-cicd)
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
| Modèle retenu | RandomForest (AUC-ROC 0.8273 après réentraînement) |

Le projet démontre la mise en œuvre d'une chaîne MLOps industrialisée : suivi d'expériences (MLflow), API de prédiction (FastAPI), interface d'analyse (React), explicabilité des décisions (SHAP + LIME), détection de dérive des données (Z-score + Evidently), réentraînement automatique multi-modèles et intégration continue (GitHub Actions).

---

## Dataset

**Home Credit Default Risk** (Kaggle)

| Caractéristique | Valeur |
|-----------------|--------|
| Clients | 307 000 |
| Features | 178 (après feature engineering) |
| Cible | `TARGET` binaire (1 = défaut, 0 = remboursement normal) |
| Déséquilibre de classes | 91.9% classe 0 / 8.1% classe 1 |

Le fort déséquilibre est traité par sur-échantillonnage **SMOTE** lors de la phase de préparation.

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| Backend & API | FastAPI, Uvicorn, Python 3.11 |
| Machine Learning | XGBoost, RandomForest, LogisticRegression, scikit-learn, imbalanced-learn (SMOTE) |
| Explicabilité | SHAP, LIME |
| Suivi d'expériences | MLflow (Tracking, Runs, Métriques) |
| Base de données | PostgreSQL 14 (`mlflow_db`, `score_credit_db`) |
| Monitoring | Evidently (data drift), Z-score statistique |
| Frontend | React, Vite, Tailwind CSS, Lucide React, Chart.js |
| Communication | Axios (HTTP) |
| CI/CD | GitHub Actions |

---

## Étapes MLOps

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | MLflow + PostgreSQL | OK |
| 2 | Préparation des données (SMOTE, feature engineering) | OK |
| 3 | Score métier FP / FN | OK |
| 4 | Entraînement multi-modèles + SHAP + LIME | OK |
| 5 | API FastAPI (15 endpoints) | OK |
| 6 | Interface React 8 pages responsive | OK |
| 7 | Data Drift Z-score + Evidently | OK |
| 8 | Réentraînement automatique multi-modèles + versioning | OK |
| 9 | Gestion clients CRUD + liaison analyses | OK |
| Bonus | CI/CD GitHub Actions | OK |

---

## Architecture technique

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│   React + Vite + Tailwind CSS + Chart.js            │
│   Dashboard | Analyse | Clients | Monitoring        │
│   Notifications | Profil | Parametres               │
│   Responsive mobile/desktop | Mode jour/nuit        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (Axios)
                      ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                           │
│   FastAPI + Uvicorn (Port 8000)                    │
│   /predict | /historique | /stats | /clients       │
│   /mlflow-runs | /drift-stats | /actions-log       │
│   /retrain | /retrain/status | /model-info         │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌──────────────────────────┐
│   MLFlow     │    │       PostgreSQL          │
│   Port 5000  │    │   mlflow_db              │
│   Tracking   │    │   score_credit_db        │
│   Runs       │    │   - application_train    │
│   Métriques  │    │   - predictions          │
│   Artefacts  │    │   - clients              │
└──────────────┘    │   - actions_log          │
                    └──────────────────────────┘
```

---

## Architecture du projet

```
Score_Credit/
├── backend/                         # API FastAPI + modèles ML + MLFlow
│   ├── data/
│   │   ├── application_train.csv    # Dataset brut (307k lignes)
│   │   └── rapport_drift.html       # Rapport Evidently
│   ├── notebooks/
│   │   ├── 01_preparation_donnees.ipynb
│   │   ├── 02_score_metier.ipynb
│   │   ├── 03_entrainement_modeles.ipynb
│   │   └── 04_data_drift.ipynb
│   ├── notebooks/models/
│   │   ├── best_xgb.pkl             # Meilleur modèle en production
│   │   ├── feature_columns.pkl      # 178 colonnes du modèle
│   │   ├── feature_medians.pkl      # Médianes pour imputation
│   │   ├── model_version.json       # Versioning (ex: 1.0.3)
│   │   ├── X_test.pkl
│   │   └── y_test.pkl
│   ├── api/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── predict.py           # Prédiction + monitoring + clients
│   │   │   └── retrain.py           # Pipeline réentraînement multi-modèles
│   │   └── schemas/client.py
│   ├── etl.py
│   ├── seed_test_data.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                        # Interface React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── ScoreForm.jsx
│   │   │   ├── ScoreResult.jsx
│   │   │   ├── ShapChart.jsx
│   │   │   └── NotificationsPanel.jsx
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── UserContext.jsx
│   │   │   └── NotificationsContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analyse.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── Monitoring.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Profil.jsx
│   │   │   └── Parametres.jsx
│   │   └── services/api.js
│   ├── package.json
│   └── README.md
│
├── docs/
│   └── screenshots/                 # Captures d'écran de l'interface
│
├── .github/
│   └── workflows/ci.yml             # CI/CD GitHub Actions
│
├── .gitignore
└── README.md
```

---

## Résultats des modèles

### Entraînement initial

| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.7154 | 48 534 |
| Random Forest | 0.6953 | 46 864 |
| XGBoost | 0.7294 | 35 289 |

### Après réentraînement automatique (données initiales + production)

| Modèle | AUC-ROC | Score Métier |
|--------|---------|--------------|
| Baseline (Dummy) | 0.5000 | 49 650 |
| Logistic Regression | 0.6870 | 254 221 |
| XGBoost | 0.7769 | 130 423 |
| RandomForest | 0.8273 | 4 400 |

Le pipeline sélectionne et déploie automatiquement le meilleur modèle après chaque réentraînement.

---

## Score métier

Dans le contexte du scoring crédit, les deux types d'erreurs n'ont pas le même coût :

| Erreur | Signification | Coût |
|--------|---------------|------|
| Faux Négatif (FN) | Accorder un crédit à un mauvais payeur | 10 |
| Faux Positif (FP) | Refuser un crédit à un bon payeur | 1 |

**Formule** : `Score = (10 x FN) + (1 x FP)` — à minimiser.

**Seuil de décision optimisé** : 0.30 (au lieu du seuil classique de 0.50). Ce seuil est calculé pour minimiser le score métier, reflétant le fait qu'un défaut de remboursement coûte 10 fois plus cher qu'une opportunité manquée.

---

## Pipeline de réentraînement

```
Données initiales (application_train)
         +
Données production (predictions 90 jours)
                    |
              Encodage + SMOTE
                    |
    XGBoost | RandomForest | LogisticRegression | DummyClassifier
                    |
       Comparaison AUC-ROC + Score métier
                    |
      Meilleur modèle → best_xgb.pkl
                    |
     Versioning automatique (1.0.0 → 1.0.1)
                    |
        Rechargement en mémoire (sans redémarrage API)
                    |
             Log dans MLFlow
```

---

## Analyse Data Drift

La détection du drift utilise le Z-score statistique :

`Z = |moyenne_production - moyenne_référence| / écart_type_référence`

| Seuil | Statut | Action |
|-------|--------|--------|
| Z ≤ 1 | NORMAL | Monitoring hebdomadaire |
| 1 < Z ≤ 2 | ALERTE | Monitoring quotidien |
| Z > 2 | CRITIQUE | Réentraînement recommandé |

| Feature | Référence | Ecart-type | Statut |
|---------|-----------|------------|--------|
| Revenu annuel | 168 798 FCFA | 237 123 | ALERTE (Z=1.36) |
| Montant crédit | 599 026 FCFA | 402 491 | NORMAL (Z=0.77) |
| Mensualité | 27 109 FCFA | 14 494 | ALERTE (Z=1.55) |

---

## Fonctionnalités de l'interface

| Page | Fonctionnalités |
|------|----------------|
| Dashboard | KPIs animés, graphiques Chart.js, historique infinite scroll, modèle actif dynamique |
| Analyse | Recherche client, formulaire 5 sections, speedometer SVG, SHAP/LIME, explication contextuelle |
| Clients | Liste tableau/cards, CRUD complet, modal création, recherche temps réel |
| Monitoring | MLFlow runs, réentraînement multi-modèles, Data Drift Z-score, barre progression |
| Notifications | Alertes système dynamiques, journal actions |
| Profil | Informations utilisateur éditables, modèle actif dynamique |
| Paramètres | Seuils drift, configuration API, informations système dynamiques |

---

## Installation

### Prérequis

- Python 3.11
- Node.js 18 ou supérieur
- PostgreSQL 14 ou supérieur

### Backend

```bash
cd backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Terminal 1 — MLFlow
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
| MLFlow UI | http://localhost:5000 |

---

## Pipeline CI/CD

```
Push sur main
     │
     ▼
┌────────────────┐   ┌──────────────────┐
│  Test Backend  │   │  Test Frontend   │
│  - FastAPI OK  │   │  - npm install   │
│  - imports OK  │   │  - npm run build │
│  - SHAP OK     │   │  - Build OK      │
└───────┬────────┘   └────────┬─────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        ┌──────────────────┐
        │  Deploy Notify   │
        └──────────────────┘
```

---

## Aperçu

<table>
<tr>
<td width="50%"><b>Tableau de bord — KPIs et graphiques</b><br><img src="docs/screenshots/screenshot_dashboard.png" alt="Dashboard"></td>
<td width="50%"><b>Tableau de bord — Historique des analyses</b><br><img src="docs/screenshots/screenshot_dashboard_1.png" alt="Dashboard historique"></td>
</tr>
<tr>
<td><b>Tableau de bord — Vue mobile</b><br><img src="docs/screenshots/screenshot_dashboard_2.png" alt="Dashboard mobile"></td>
<td><b>Analyse — Formulaire client</b><br><img src="docs/screenshots/screenshot_analyse_formulaire.png" alt="Analyse formulaire"></td>
</tr>
<tr>
<td><b>Analyse — Résultat et speedometer</b><br><img src="docs/screenshots/screenshot_analyse_resultat.png" alt="Analyse résultat"></td>
<td><b>Analyse — Explication SHAP / LIME</b><br><img src="docs/screenshots/screenshot_analyse_resultat_1.png" alt="Analyse SHAP LIME"></td>
</tr>
<tr>
<td><b>Gestion des clients</b><br><img src="docs/screenshots/screenshot_clients.png" alt="Clients"></td>
<td><b>Notifications système</b><br><img src="docs/screenshots/screenshot_notifications.png" alt="Notifications"></td>
</tr>
<tr>
<td><b>Monitoring — MLFlow et réentraînement</b><br><img src="docs/screenshots/screenshot_monitoring.png" alt="Monitoring"></td>
<td><b>Monitoring — Data Drift Z-score</b><br><img src="docs/screenshots/screenshot_monitoring_1.png" alt="Monitoring drift"></td>
</tr>
<tr>
<td><b>Profil utilisateur</b><br><img src="docs/screenshots/screenshot_profil.png" alt="Profil"></td>
<td><b>Paramètres — Profil et apparence</b><br><img src="docs/screenshots/screenshot_parametres.png" alt="Paramètres"></td>
</tr>
<tr>
<td><b>Paramètres — Seuils Data Drift</b><br><img src="docs/screenshots/screenshot_parametres_1.png" alt="Paramètres drift"></td>
<td><b>Paramètres — Configuration système</b><br><img src="docs/screenshots/screenshot_parametres_2.png" alt="Paramètres système"></td>
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