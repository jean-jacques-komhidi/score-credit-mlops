# 🏦 Score Crédit — Projet MLOps Complet

## Description
Projet MLOps complet de scoring crédit (risque de défaut de paiement).  
Ce projet couvre l'intégralité du cycle de vie d'un modèle ML : de la préparation des données jusqu'au déploiement en production avec monitoring du data drift.

## Dataset
**Home Credit Default Risk** (Kaggle)  
- ~307 000 clients
- 122 features
- Cible binaire : `TARGET` (1 = défaut de paiement, 0 = remboursement normal)

## Architecture du projet
```
Score_Credit/
├── backend/            # API FastAPI + modèles ML + MLFlow
│   ├── data/
│   ├── notebooks/
│   ├── models/
│   ├── api/
│   └── requirements.txt
│
├── frontend/           # Interface React + Tailwind
│   ├── src/
│   └── package.json
│
├── .gitignore
└── README.md           # Ce fichier
```

## Étapes du projet

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | Préparation environnement MLFlow | 🔄 En cours |
| 2 | Exploration et préparation des données | 🔄 En cours |
| 3 | Définition du score métier | ⏳ À faire |
| 4 | Entraînement et comparaison des modèles | ⏳ À faire |
| 5 | Déploiement API FastAPI | ⏳ À faire |
| 6 | Interface React | ⏳ À faire |
| 7 | Data drift et monitoring | ⏳ À faire |

## Lancer le projet

### Backend
```bash
cd backend
venv\Scripts\activate
uvicorn api.main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

### MLFlow UI
```bash
cd backend
mlflow ui
```

## Équipe
- **Étudiant** : KOMHIDI Jean Jacques
- **Encadrant** : AIDARA CHAMSEDINE — Tech Lead Data & IA
- **Formation** : Master 2 UCAO
- **Année** : 2025-2026
