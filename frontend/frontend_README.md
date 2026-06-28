# 🎨 Frontend — Score Crédit MLOps

## Description
Interface utilisateur React pour interagir avec l'API de scoring crédit.
Permet de saisir les données d'un client et d'obtenir en temps réel son score de risque,
une explication SHAP en langage naturel, et de visualiser les performances du système.

## Stack technique
| Outil | Rôle |
|-------|------|
| React + Vite | Framework frontend |
| Tailwind CSS v3 | Styling |
| Lucide React | Icônes professionnelles |
| Axios | Appels HTTP vers l'API FastAPI |
| React Router DOM | Navigation entre pages |

## Structure du projet
```
frontend/src/
├── components/
│   ├── Header.jsx         # Barre du haut + toggle mode jour/nuit
│   ├── Sidebar.jsx        # Navigation latérale
│   ├── MetricCard.jsx     # Cards de métriques
│   ├── ScoreForm.jsx      # Formulaire de saisie client (amélioré)
│   ├── ScoreResult.jsx    # Affichage du résultat
│   └── ShapChart.jsx      # Graphique SHAP + explication texte
├── context/
│   └── ThemeContext.jsx   # Gestion mode jour/nuit
├── pages/
│   ├── Dashboard.jsx      # Tableau de bord avec historique réel
│   ├── Analyse.jsx        # Page d'analyse client
│   └── Monitoring.jsx     # Performance modèles + Data Drift
├── services/
│   └── api.js             # Tous les appels API
├── App.jsx                # Routing principal
└── index.css              # Styles globaux Tailwind
```

## Pages de l'application

### 📊 Dashboard
- Cards de métriques en temps réel (depuis PostgreSQL)
- Historique des analyses avec décisions et niveaux de risque
- Statut de l'API (XGBoost opérationnel)

### 🔍 Analyse de dossier
- Formulaire client avec sections organisées :
  - Informations personnelles (âge, genre, enfants)
  - Situation professionnelle (ancienneté, revenu)
  - Patrimoine (voiture, bien immobilier)
  - Informations du crédit (montant, mensualité, type)
  - Scores de solvabilité externes (sliders 0-1)
- Résultat en temps réel (ACCORDÉ/REFUSÉ)
- Graphique SHAP avec explication en français
- Explication en langage naturel pour les non-experts

### 📈 Monitoring
- Performance des modèles MLFlow (runs dédupliqués)
- Analyse Data Drift (référence vs production)
- Statut global du système

## Installation

### 1. Prérequis
- Node.js >= 18
- npm >= 9

### 2. Installer les dépendances
```bash
cd frontend
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
# Modifier VITE_API_URL si nécessaire
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

L'application sera disponible sur : http://localhost:5173

### 5. Build pour la production
```bash
npm run build
```

## Configuration `.env`
```env
VITE_API_URL=http://127.0.0.1:8000
```

## Fonctionnalités
- 🌙 Mode jour/nuit avec toggle
- 📋 Formulaire client intuitif avec boutons radio
- 📊 Graphique SHAP interactif
- 💬 Explication en langage naturel
- 📈 Dashboard avec données réelles PostgreSQL
- 🔄 Actualisation en temps réel
- 📱 Interface responsive

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
