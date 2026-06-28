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
│   ├── Header.jsx              # Barre du haut + toggle mode + profil + notifications
│   ├── Sidebar.jsx             # Navigation latérale
│   ├── MetricCard.jsx          # Cards de métriques
│   ├── ScoreForm.jsx           # Formulaire de saisie client (amélioré)
│   ├── ScoreResult.jsx         # Affichage du résultat
│   ├── ShapChart.jsx           # Graphique SHAP + explication texte
│   ├── ProfileModal.jsx        # Modal profil utilisateur éditable
│   └── NotificationsPanel.jsx  # Panel notifications dynamiques
├── context/
│   ├── ThemeContext.jsx        # Gestion mode jour/nuit
│   └── UserContext.jsx         # Gestion profil utilisateur
├── pages/
│   ├── Dashboard.jsx           # Tableau de bord avec historique réel
│   ├── Analyse.jsx             # Page d'analyse client
│   ├── Monitoring.jsx          # Performance modèles + Data Drift
│   └── Parametres.jsx          # Configuration système et profil
├── services/
│   └── api.js                  # Tous les appels API
├── App.jsx                     # Routing principal
└── index.css                   # Styles globaux Tailwind
```

## Pages de l'application

### 📊 Dashboard
- Cards de métriques en temps réel (depuis PostgreSQL)
- Historique des analyses avec décisions et niveaux de risque
- Statut de l'API (XGBoost opérationnel)
- Bouton d'actualisation

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
- Colonne droite sticky pour suivre le scroll

### 📈 Monitoring
- Performance des modèles MLFlow (runs dédupliqués par modèle)
- Analyse Data Drift (référence vs production)
- Barres de progression par feature
- Statut global du système

### ⚙️ Paramètres
- Modification du profil utilisateur
- Toggle mode jour/nuit
- Seuils d'alerte data drift configurables (sliders)
- Configuration des URLs API et MLFlow
- Informations système (modèle, AUC-ROC, dataset)

## Composants interactifs

### 👤 ProfileModal
- Modal avec avatar et informations utilisateur
- Mode édition avec sauvegarde
- Stats rapides (modèle actif, AUC-ROC)

### 🔔 NotificationsPanel
- Panel latéral avec alertes système dynamiques
- Résumé des analyses (depuis PostgreSQL)
- Statut drift par feature (depuis API)
- Historique des actions réelles (depuis table `actions_log`)

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

## Appels API disponibles
| Fonction | Endpoint | Description |
|----------|----------|-------------|
| `predictCredit` | POST /api/predict | Prédiction + SHAP |
| `checkHealth` | GET /api/health | Statut API |
| `getHistorique` | GET /api/historique | Historique prédictions |
| `getStats` | GET /api/stats | Statistiques globales |
| `getMlflowRuns` | GET /api/mlflow-runs | Runs MLFlow |
| `getDriftStats` | GET /api/drift-stats | Analyse drift |
| `getActionsLog` | GET /api/actions-log | Historique actions |

## Fonctionnalités
- 🌙 Mode jour/nuit avec toggle
- 👤 Profil utilisateur éditable
- 🔔 Notifications dynamiques depuis PostgreSQL
- 📋 Formulaire client intuitif avec boutons radio et sliders
- 📊 Graphique SHAP interactif
- 💬 Explication en langage naturel
- 📈 Dashboard avec données réelles PostgreSQL
- 🔄 Actualisation en temps réel
- ⚙️ Page paramètres complète
- 📱 Interface responsive

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026