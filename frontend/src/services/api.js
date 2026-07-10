import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// ─────────────────────────────────────────────
// PRÉDICTION
// ─────────────────────────────────────────────
export const predictCredit = async (clientData) => {
  try {
    const response = await axios.post(`${API_URL}/api/predict`, clientData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur de connexion à l\'API')
  }
}

// ─────────────────────────────────────────────
// SANTÉ DE L'API
// ─────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/health`)
    return response.data
  } catch (error) {
    throw new Error('API non disponible')
  }
}

// ─────────────────────────────────────────────
// HISTORIQUE DES PRÉDICTIONS (paginé)
// ─────────────────────────────────────────────
export const getHistorique = async (limit = 20, offset = 0) => {
  try {
    const response = await axios.get(`${API_URL}/api/historique`, {
      params: { limit, offset }
    })
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement historique')
  }
}

// ─────────────────────────────────────────────
// STATISTIQUES GLOBALES
// ─────────────────────────────────────────────
export const getStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/stats`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement stats')
  }
}

// ─────────────────────────────────────────────
// MLFLOW RUNS
// ─────────────────────────────────────────────
export const getMlflowRuns = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/mlflow-runs`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement MLFlow runs')
  }
}

// ─────────────────────────────────────────────
// DATA DRIFT
// ─────────────────────────────────────────────
export const getDriftStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/drift-stats`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement drift stats')
  }
}

// ─────────────────────────────────────────────
// ACTIONS LOG
// ─────────────────────────────────────────────
export const getActionsLog = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/actions-log`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement actions log')
  }
}

// ─────────────────────────────────────────────
// INFORMATIONS DU MODÈLE ACTIF
// ─────────────────────────────────────────────
export const getModelInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/model-info`)
    return response.data
  } catch (error) {
    return { model_name: "XGBoost", version: "1.0.0", auc_roc: 0.7294 }
  }
}

// ─────────────────────────────────────────────
// CLIENTS — CRUD
// ─────────────────────────────────────────────
export const rechercherClients = async (q = '', limit = 20) => {
  try {
    const response = await axios.get(`${API_URL}/api/clients`, {
      params: { q, limit }
    })
    return response.data
  } catch (error) {
    throw new Error('Erreur recherche clients')
  }
}

export const creerClient = async (clientData) => {
  try {
    const response = await axios.post(`${API_URL}/api/clients`, clientData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur création client')
  }
}

export const getDetailClient = async (clientId) => {
  try {
    const response = await axios.get(`${API_URL}/api/clients/${clientId}`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement client')
  }
}

export const modifierClient = async (clientId, clientData) => {
  try {
    const response = await axios.put(`${API_URL}/api/clients/${clientId}`, clientData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur modification client')
  }
}

export const supprimerClient = async (clientId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/clients/${clientId}`)
    return response.data
  } catch (error) {
    throw new Error('Erreur suppression client')
  }
}

// ─────────────────────────────────────────────
// RÉENTRAÎNEMENT
// ─────────────────────────────────────────────
export const lancerRetrain = async () => {
  try {
    const response = await axios.post(`${API_URL}/api/retrain`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur lancement réentraînement')
  }
}

export const getRetrainStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/retrain/status`)
    return response.data
  } catch (error) {
    throw new Error('Erreur statut réentraînement')
  }
}