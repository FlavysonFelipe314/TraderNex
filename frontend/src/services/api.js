import axios from 'axios'

// Use relative URL to leverage nginx proxy in production
// In development, use environment variable or default to localhost:5004
// Note: Routes already include /api prefix (e.g., /api/auth/login)
const getBaseURL = () => {
  // If running in Docker/production, use nginx proxy (routes start with /api)
  if (import.meta.env.PROD) {
    return '' // Empty baseURL since routes already have /api prefix
  }
  // Development: use environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:5004'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
