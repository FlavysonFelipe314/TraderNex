import axios from 'axios'

// Use relative URL to leverage nginx proxy in production
// In development, use Vite proxy (configured in vite.config.js)
// Note: Routes already include /api prefix (e.g., /api/auth/login)
const getBaseURL = () => {
  // If running in Docker/production, use nginx proxy (routes start with /api)
  if (import.meta.env.PROD) {
    return '' // Empty baseURL since routes already have /api prefix
  }
  // Development: use empty baseURL to leverage Vite proxy
  // The proxy in vite.config.js will forward /api requests to backend
  return ''
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
    // Só fazer logout se for realmente um erro de token inválido/expirado
    // Não fazer logout em outros casos de 401 (ex: credenciais incorretas, etc)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || ''
      const isTokenError = 
        errorMessage.includes('Token') || 
        errorMessage.includes('token') ||
        errorMessage.includes('Token inválido') ||
        errorMessage.includes('Token não fornecido') ||
        errorMessage.includes('expirado') ||
        errorMessage.includes('expirada') ||
        error.config?.headers?.Authorization // Se tinha token na requisição, provavelmente expirou
      
      // Só deslogar se for erro de token realmente
      if (isTokenError && error.config?.headers?.Authorization) {
        // Verificar se já estamos na página de login para evitar loop
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
      // Caso contrário, apenas rejeitar a promise sem fazer logout
    } else if (error.response?.status === 403) {
      // Acesso negado (não é admin tentando acessar rota de admin)
      // Não limpar token, apenas redirecionar para dashboard
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/dashboard'
      }
    }
    return Promise.reject(error)
  }
)

export default api
