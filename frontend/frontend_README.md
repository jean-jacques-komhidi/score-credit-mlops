# 🎨 Frontend — Score Crédit MLOps

## Description
Interface utilisateur React pour interagir avec l'API de scoring crédit.  
Permet de saisir les données d'un client et d'obtenir en temps réel son score de risque de défaut de paiement.

## Stack technique
- **React + Vite** — Framework frontend
- **Tailwind CSS v3** — Styling
- **Axios** — Appels HTTP vers l'API FastAPI
- **Recharts** — Visualisation des scores et graphiques

## Structure du projet
```
frontend/
├── public/             # Fichiers statiques
├── src/
│   ├── assets/         # Images, icônes
│   ├── components/     # Composants React réutilisables
│   │   ├── ScoreForm.jsx       # Formulaire de saisie client
│   │   ├── ScoreResult.jsx     # Affichage du résultat
│   │   └── ScoreGauge.jsx      # Jauge de risque visuelle
│   ├── pages/          # Pages de l'application
│   │   ├── Home.jsx            # Page principale
│   │   └── Dashboard.jsx       # Tableau de bord
│   ├── services/       # Appels API
│   │   └── api.js              # Configuration Axios
│   ├── App.jsx         # Composant racine
│   ├── main.jsx        # Point d'entrée
│   └── index.css       # Styles globaux Tailwind
├── tailwind.config.js  # Configuration Tailwind
├── vite.config.js      # Configuration Vite
├── package.json        # Dépendances Node
└── README.md           # Ce fichier
```

## Installation

### 1. Prérequis
- Node.js >= 18
- npm >= 9

### 2. Installer les dépendances
```bash
cd Score_Credit/frontend
npm install
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```

L'application sera disponible sur : http://localhost:5173

### 4. Build pour la production
```bash
npm run build
```

## Configuration
Créer un fichier `.env` à la racine du frontend :
```env
VITE_API_URL=http://localhost:8000
```

## Fonctionnalités
- 📋 Formulaire de saisie des données client
- 📊 Affichage du score de risque avec jauge visuelle
- 📈 Graphiques d'analyse (importance des features)
- 🔴🟡🟢 Code couleur selon le niveau de risque
