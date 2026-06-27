# 🧠 Backend — Score Crédit MLOps

## Description
API de scoring crédit basée sur un modèle de Machine Learning entraîné sur le dataset Home Credit Default Risk.  
Ce backend gère l'entraînement des modèles, le tracking MLFlow et l'exposition d'une API REST avec FastAPI.

## Stack technique
- **Python 3.12**
- **FastAPI** — API REST
- **MLFlow** — Tracking et versioning des modèles
- **Scikit-learn / XGBoost** — Modèles de classification
- **SHAP** — Explicabilité des modèles
- **Evidently** — Détection du data drift
- **Pandas / NumPy** — Manipulation des données

## Structure du projet
```
backend/
├── data/               # Données brutes et traitées (non versionné)
├── notebooks/          # Notebooks d'exploration et d'entraînement
├── models/             # Modèles sauvegardés (.pkl, .json)
├── api/                # Code FastAPI
│   ├── main.py         # Point d'entrée de l'API
│   ├── routes/         # Routes de l'API
│   └── schemas/        # Schémas Pydantic
├── venv/               # Environnement virtuel (non versionné)
├── requirements.txt    # Dépendances Python
└── README.md           # Ce fichier
```

## Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd Score_Credit/backend
```

### 2. Créer et activer l'environnement virtuel
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 4. Lancer l'API
```bash
uvicorn api.main:app --reload
```

L'API sera disponible sur : http://localhost:8000  
Documentation interactive : http://localhost:8000/docs

### 5. Lancer MLFlow UI
```bash
mlflow ui
```

MLFlow sera disponible sur : http://localhost:5000

## Endpoints principaux
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict` | Prédiction du score de crédit |
| GET | `/model/info` | Informations sur le modèle en production |

## Variables d'environnement
Créer un fichier `.env` à la racine du backend :
```env
MLFLOW_TRACKING_URI=sqlite:///mlruns.db
MODEL_PATH=models/best_model.pkl
```
