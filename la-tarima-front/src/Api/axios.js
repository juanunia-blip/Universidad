import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

/**
 * Interceptor para peticiones
 * Detecta FormData y remueve Content-Type para que axios/navegador lo maneje automáticamente
 */
api.interceptors.request.use(
  config => {
    // Si el data es FormData, remover el header Content-Type
    // Axios lo calculará automáticamente con el boundary correcto
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    const storedAuth = window.localStorage.getItem('laTarimaAuth')
    if (storedAuth) {
      try {
        const { token } = JSON.parse(storedAuth)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // Ignorar si el contenido de localStorage no es JSON válido
      }
    }

    return config
  },
  error => Promise.reject(error)
)

/**
 * Interceptor para manejar errores en respuestas
 */
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Acceso no autorizado. Por favor inicia sesión.')
    }
    if (error.response?.status === 403) {
      console.warn('No tienes permisos para acceder a este recurso.')
    }
    return Promise.reject(error)
  }
)

export default api
