import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const predictCredit = async (clientData) => {
  try {
    const response = await axios.post(`${API_URL}/api/predict`, clientData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur de connexion à l\'API')
  }
}

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/health`)
    return response.data
  } catch (error) {
    throw new Error('API non disponible')
  }
}

export const getHistorique = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/historique`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement historique')
  }
}

export const getStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/stats`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement stats')
  }
}

export const getMlflowRuns = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/mlflow-runs`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement MLFlow runs')
  }
}

export const getDriftStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/drift-stats`)
    return response.data
  } catch (error) {
    throw new Error('Erreur chargement drift stats')
  }
}