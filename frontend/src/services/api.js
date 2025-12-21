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
    // Tratar erros 429 (Rate Limit) - não deslogar, apenas rejeitar
    if (error.response?.status === 429) {
      console.warn('[API] Rate limit atingido, aguardando...')
      // Não fazer logout em caso de rate limit
      return Promise.reject(error)
    }

    // Só fazer logout se for realmente um erro de token inválido/expirado
    // Não fazer logout em outros casos de 401 (ex: credenciais incorretas, rate limit, requisições simultâneas, etc)
    if (error.response?.status === 401) {
      const errorMessage = String(error.response?.data?.message || '').toLowerCase()
      const errorData = error.response?.data || {}
      
      // Verificar se é realmente um erro de autenticação/token
      const isTokenError = 
        errorMessage.includes('token') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('expirado') ||
        errorMessage.includes('expirada') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('não fornecido') ||
        (errorData.error && String(errorData.error).toLowerCase().includes('token'))
      
      // Verificar se a requisição tinha token (se não tinha, não é erro de token expirado)
      const hadToken = !!error.config?.headers?.Authorization
      
      // Só deslogar se:
      // 1. É realmente um erro de token (não rate limit ou outro erro)
      // 2. A requisição tinha token (se não tinha, pode ser que o usuário não esteja logado)
      // 3. Não é um erro de requisição cancelada ou network
      const isCanceled = error.code === 'ERR_CANCELED' || error.message?.includes('canceled')
      const isNetworkError = !error.response && error.message
      
      if (isTokenError && hadToken && !isCanceled && !isNetworkError) {
        // Verificar se já estamos na página de login para evitar loop
        if (!window.location.pathname.includes('/login')) {
          console.warn('[API] Token inválido/expirado, deslogando usuário')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
        }
      } else {
        // Não é erro de token, apenas logar e rejeitar sem deslogar
        console.warn('[API] Erro 401 não relacionado a token:', {
          message: errorMessage,
          hadToken,
          isCanceled,
          isNetworkError,
          url: error.config?.url
        })
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
