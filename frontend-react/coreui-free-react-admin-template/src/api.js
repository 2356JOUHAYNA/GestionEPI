// src/api.js
import axios from 'axios'

// ⚠️ Change l'URL si ton backend n'est pas à 127.0.0.1:8000
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

// Ajoute automatiquement le token aux requêtes
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Optionnel : si 401, on déconnecte proprement
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API
