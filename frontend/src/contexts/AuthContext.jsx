import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { isUserAdmin } from '../utils/authUtils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Erro ao recuperar dados do usuário:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Verificar se há um usuário anterior logado
      let previousUserId = null
      try {
        const previousUserData = localStorage.getItem('user')
        if (previousUserData) {
          const previousUser = JSON.parse(previousUserData)
          previousUserId = previousUser.id || previousUser.userId || previousUser.user_id
        }
      } catch (e) {
        // Ignorar erro
      }
      
      const response = await api.post('/api/auth/login', { email, password })
      
      // A API retorna: { success, message, data: { user, token } }
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data

        // Normalizar campos do backend para o formato do frontend
        const adminFlag = isUserAdmin(user)
        const normalizedUser = {
          ...user,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          first_name: user.first_name || user.firstName,
          last_name: user.last_name || user.lastName,
          is_admin: adminFlag,
          isAdmin: adminFlag
        }
        
        const newUserId = normalizedUser.id || normalizedUser.userId || normalizedUser.user_id
        
        // Se o usuário mudou, limpar cache do usuário anterior
        if (previousUserId && previousUserId !== newUserId) {
          try {
            const { clearCache } = await import('../utils/myfxbookCache')
            clearCache(previousUserId)
            console.log('[Auth] Cache do MyFXBook limpo para usuário anterior:', previousUserId)
          } catch (cacheError) {
            console.warn('[Auth] Erro ao limpar cache do usuário anterior:', cacheError)
          }
        }

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(normalizedUser)

        return { success: true, user: normalizedUser, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao fazer login. Tente novamente.' 
        }
      }
    } catch (error) {
      // Tratar erros de validação ou outros erros
      const errorData = error.response?.data
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Erros de validação
        const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
        return { success: false, message: validationErrors, errors: errorData.errors }
      }
      
      const message = errorData?.message || 'Erro ao fazer login. Tente novamente.'
      return { success: false, message }
    }
  }

  const register = async (email, password, firstName, lastName, phone, country, referralCode = null) => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phone,
        country,
        referralCode
      })
      
      // A API retorna: { success, message, data: { user, token } }
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)

        return { success: true, user, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao registrar. Tente novamente.' 
        }
      }
    } catch (error) {
      // Tratar erros de validação ou outros erros
      const errorData = error.response?.data
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Erros de validação
        const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
        return { success: false, message: validationErrors, errors: errorData.errors }
      }
      
      const message = errorData?.message || 'Erro ao registrar. Tente novamente.'
      return { success: false, message }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      
      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao solicitar recuperação de senha.' 
        }
      }
    } catch (error) {
      const errorData = error.response?.data
      const message = errorData?.message || 'Erro ao solicitar recuperação de senha. Tente novamente.'
      return { success: false, message }
    }
  }

  const resetPassword = async (token, password) => {
    try {
      const response = await api.post('/api/auth/reset-password', { token, password })
      
      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao redefinir senha.' 
        }
      }
    } catch (error) {
      const errorData = error.response?.data
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
        return { success: false, message: validationErrors, errors: errorData.errors }
      }
      
      const message = errorData?.message || 'Erro ao redefinir senha. Tente novamente.'
      return { success: false, message }
    }
  }

  const verifyEmail = async (token) => {
    try {
      const response = await api.post('/api/auth/verify-email', { token })
      
      if (response.data.success) {
        // Atualizar estado do usuário se estiver logado
        if (user) {
          const updatedUser = { ...user, emailVerified: true }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        return { success: true, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao verificar e-mail.' 
        }
      }
    } catch (error) {
      const errorData = error.response?.data
      const message = errorData?.message || 'Erro ao verificar e-mail. Tente novamente.'
      return { success: false, message }
    }
  }

  const getProfile = async () => {
    try {
      console.log('[getProfile] Fazendo requisição para /api/auth/profile')
      const response = await api.get('/api/auth/profile')
      console.log('[getProfile] Resposta recebida:', response.data)
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data
        console.log('[getProfile] Dados do usuário recebidos:', userData)
        const currentIsAdmin = isUserAdmin(user)
        const backendIsAdmin = isUserAdmin(userData)
        const finalIsAdmin = backendIsAdmin || currentIsAdmin

        const normalizedUser = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          country: userData.country,
          emailVerified: userData.email_verified,
          accountType: userData.account_type,
          balance: userData.balance != null && !isNaN(userData.balance) ? Number(userData.balance) : 0,
          totalInvested: userData.total_invested != null && !isNaN(userData.total_invested) ? Number(userData.total_invested) : 0,
          totalProfit: userData.total_profit != null && !isNaN(userData.total_profit) ? Number(userData.total_profit) : 0,
          profitPercentage: userData.profit_percentage != null && !isNaN(userData.profit_percentage) ? Number(userData.profit_percentage) : 0,
          referralCode: userData.referral_code,
          street: userData.street,
          number: userData.number,
          neighborhood: userData.neighborhood,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zip_code,
          zip_code: userData.zip_code,
          complement: userData.complement,
          // Preservar is_admin - priorizar valor do backend, mas manter do contexto atual se necessário
          is_admin: finalIsAdmin,
          isAdmin: finalIsAdmin
        }
        console.log('[getProfile] Usuário normalizado:', normalizedUser)
        console.log('[getProfile] is_admin preservado - backend:', backendIsAdmin, 'atual:', currentIsAdmin, 'final:', finalIsAdmin)
        setUser(normalizedUser)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        return { success: true, user: normalizedUser }
      } else {
        console.warn('[getProfile] Resposta sem dados:', response.data)
        return { 
          success: false, 
          message: response.data.message || 'Erro ao obter perfil.' 
        }
      }
    } catch (error) {
      console.error('[getProfile] Erro na requisição:', error)
      console.error('[getProfile] Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      })
      const errorData = error.response?.data
      const message = errorData?.message || 'Erro ao obter perfil. Tente novamente.'
      return { success: false, message }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData)
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data
        // Normalizar campos do backend para o formato do frontend
        // IMPORTANTE: Preservar is_admin do user atual se não vier do backend
        const currentIsAdmin = isUserAdmin(user)
        const backendIsAdmin = isUserAdmin(userData)
        const finalIsAdmin = backendIsAdmin || currentIsAdmin

        const normalizedUser = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          country: userData.country,
          emailVerified: userData.email_verified,
          accountType: userData.account_type,
          balance: userData.balance != null && !isNaN(userData.balance) ? Number(userData.balance) : 0,
          totalInvested: userData.total_invested != null && !isNaN(userData.total_invested) ? Number(userData.total_invested) : 0,
          totalProfit: userData.total_profit != null && !isNaN(userData.total_profit) ? Number(userData.total_profit) : 0,
          profitPercentage: userData.profit_percentage != null && !isNaN(userData.profit_percentage) ? Number(userData.profit_percentage) : 0,
          referralCode: userData.referral_code,
          street: userData.street,
          number: userData.number,
          neighborhood: userData.neighborhood,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zip_code,
          zip_code: userData.zip_code,
          complement: userData.complement,
          is_admin: finalIsAdmin,
          isAdmin: finalIsAdmin
        }
        setUser(normalizedUser)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        return { success: true, user: normalizedUser, message: response.data.message }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao atualizar perfil.' 
        }
      }
    } catch (error) {
      const errorData = error.response?.data
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
        return { success: false, message: validationErrors, errors: errorData.errors }
      }
      
      const message = errorData?.message || 'Erro ao atualizar perfil. Tente novamente.'
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      // Obter userId antes de limpar
      let userId = null
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          userId = user.id || user.userId || user.user_id
        }
      } catch (e) {
        // Ignorar erro
      }
      
      // Limpar cache do MyFXBook antes de fazer logout
      if (userId) {
        try {
          const { clearCache } = await import('../utils/myfxbookCache')
          clearCache(userId)
          console.log('[Auth] Cache do MyFXBook limpo para usuário:', userId)
        } catch (cacheError) {
          console.warn('[Auth] Erro ao limpar cache do MyFXBook:', cacheError)
        }
      }
      
      // Chamar o endpoint de logout no backend (opcional, mas boa prática)
      try {
        await api.post('/api/auth/logout')
      } catch (error) {
        // Se falhar, continua com o logout local mesmo assim
        console.warn('Erro ao fazer logout no servidor:', error)
      }
      
      // Limpar dados locais
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      
      // Limpar todas as flags de setup de cache
      if (typeof window !== 'undefined') {
        Object.keys(window).forEach(key => {
          if (key.startsWith('myfxbookCacheSetup_')) {
            delete window[key]
          }
        })
      }
      
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo em caso de erro, limpar dados locais
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      
      // Limpar cache geral como fallback
      try {
        const { clearCache } = await import('../utils/myfxbookCache')
        clearCache() // Limpar todos os caches
      } catch (cacheError) {
        // Ignorar erro
      }
      
      window.location.href = '/login'
    }
  }

  const value = {
    user,
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getProfile,
    updateProfile,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
