# Frontend — Score Crédit MLOps

## Description
Interface utilisateur React pour interagir avec l'API de scoring crédit.
Permet de saisir les données d'un client, d'obtenir en temps réel son score de risque,
une explication SHAP/LIME en langage naturel, et de visualiser les performances du système.
L'interface est entièrement responsive (mobile et desktop) avec un mode jour/nuit.

## Stack technique
| Outil | Rôle |
|-------|------|
| React + Vite | Framework frontend |
| Tailwind CSS v3 | Styling responsive |
| Lucide React | Icônes |
| Axios | Appels HTTP vers l'API FastAPI |
| React Router DOM | Navigation entre pages |
| Chart.js | Graphiques dashboard |

## Structure du projet
```
frontend/src/
├── components/
│   ├── Header.jsx              # Barre du haut + toggle thème + profil
│   ├── Sidebar.jsx             # Navigation latérale (desktop + drawer mobile)
│   ├── MetricCard.jsx          # Cards de métriques animées
│   ├── ScoreForm.jsx           # Formulaire de saisie client
│   ├── ScoreResult.jsx         # Résultat + speedometer SVG animé
│   ├── ShapChart.jsx           # Graphique SHAP + LIME avec toggle
│   └── NotificationsPanel.jsx  # Panel notifications dynamiques
├── context/
│   ├── ThemeContext.jsx        # Gestion mode jour/nuit
│   ├── UserContext.jsx         # Gestion profil utilisateur
│   └── NotificationsContext.jsx# Compteur notifications non lues
├── pages/
│   ├── Dashboard.jsx           # Tableau de bord + infinite scroll
│   ├── Analyse.jsx             # Recherche client + analyse crédit
│   ├── Clients.jsx             # Liste clients + CRUD
│   ├── ClientDetail.jsx        # Fiche client + historique analyses
│   ├── Monitoring.jsx          # MLFlow + Data Drift + réentraînement
│   ├── Notifications.jsx       # Alertes système + journal
│   ├── Profil.jsx              # Profil utilisateur éditable
│   └── Parametres.jsx          # Configuration système
├── services/
│   └── api.js                  # Tous les appels API centralisés
├── App.jsx                     # Routing principal
└── index.css                   # Styles globaux Tailwind
```

## Pages de l'application

### Dashboard
- Cards de métriques en temps réel (depuis PostgreSQL)
- Graphiques Chart.js (taux d'accord, distribution des risques)
- Historique des analyses avec infinite scroll (20 prédictions par page)
- Colonne client associée à chaque analyse

### Analyse de dossier
- Recherche client par nom, prénom, numéro ou email (debounce 400ms)
- Fiche client avec calcul automatique de l'âge depuis la date de naissance
- Formulaire organisé en 5 sections :
  - Informations personnelles (âge, genre, enfants)
  - Situation professionnelle (ancienneté, revenu)
  - Patrimoine (voiture, bien immobilier)
  - Informations du crédit (montant, mensualité, type)
  - Scores de solvabilité externes (sliders 0-1)
- Résultat avec speedometer SVG animé (ACCORDÉ / REFUSÉ)
- Toggle SHAP / LIME avec labels en français
- Scroll automatique vers le résultat sur mobile

### Clients
- Tableau desktop / cards mobile
- Recherche temps réel avec debounce
- Modal création client (slide depuis le bas sur mobile)
- Navigation vers la fiche détail

### Détail client
- Informations CRUD complètes (modifier, supprimer)
- Tableau des analyses desktop / cards mobile
- Statistiques : total, accordés, refusés, dernière décision
- Bouton "Nouvelle analyse" lié au client

### Monitoring
- 4 KPIs : AUC-ROC, Score métier, Version modèle, Statut drift
- Bouton réentraînement multi-modèles (rouge si drift critique)
- Barre de progression avec messages en temps réel (polling 2s)
- Résultat détaillé : comparaison des 4 modèles entraînés
- Tableau MLFlow avec AUC-ROC + Score métier par modèle
- Data Drift avec Z-score par feature + interprétation

### Notifications
- Alertes système construites depuis les données réelles (stats + drift)
- Journal des actions depuis la table `actions_log`

### Profil
- Informations utilisateur éditables
- Modèle actif et AUC-ROC

### Paramètres
- Modification du profil utilisateur
- Toggle mode jour/nuit
- Seuils d'alerte data drift configurables (sliders)
- Configuration URLs API et MLFlow
- Informations système (modèle, AUC-ROC, dataset, version)

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
| `predictCredit` | POST /api/predict | Prédiction + SHAP + LIME |
| `checkHealth` | GET /api/health | Statut API |
| `getHistorique` | GET /api/historique | Historique paginé (limit + offset) |
| `getStats` | GET /api/stats | Statistiques globales |
| `getMlflowRuns` | GET /api/mlflow-runs | Runs MLFlow toutes expériences |
| `getDriftStats` | GET /api/drift-stats | Analyse drift Z-score |
| `getActionsLog` | GET /api/actions-log | Historique actions système |
| `rechercherClients` | GET /api/clients | Recherche clients |
| `creerClient` | POST /api/clients | Créer un client |
| `getDetailClient` | GET /api/clients/{id} | Détail + historique analyses |
| `modifierClient` | PUT /api/clients/{id} | Modifier un client |
| `supprimerClient` | DELETE /api/clients/{id} | Supprimer un client |
| `lancerRetrain` | POST /api/retrain | Lancer le réentraînement |
| `getRetrainStatus` | GET /api/retrain/status | Statut + progression réentraînement |

## Fonctionnalités
- Mode jour/nuit avec persistance
- Profil utilisateur éditable
- Notifications dynamiques depuis PostgreSQL
- Formulaire client avec validation et messages d'erreur
- Speedometer SVG animé pour le score de risque
- Toggle SHAP / LIME avec labels en français
- Dashboard avec données réelles et infinite scroll
- Gestion clients CRUD complète
- Réentraînement multi-modèles avec barre de progression
- Data Drift avec Z-score et interprétation
- Interface entièrement responsive (mobile et desktop)
- Sidebar avec drawer hamburger sur mobile

## Design
- Palette épurée : bleu pour les actions, vert pour ACCORDÉ, rouge pour REFUSÉ
- Icônes sur fond gris neutre
- Badges avec bordure colorée sans fond coloré
- Liens actifs sidebar en gris discret
- Transitions et animations légères

## Auteur
**KOMHIDI Jean Jacques** — Master 2 UCAO
Encadrant : AIDARA CHAMSEDINE — Tech Lead Data & IA
Année : 2025-2026