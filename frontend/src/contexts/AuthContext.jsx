import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
      const response = await api.post('/api/auth/login', { email, password })
      
      // A API retorna: { success, message, data: { user, token } }
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data

        // Normalizar campos do backend para o formato do frontend
        const normalizedUser = {
          ...user,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          first_name: user.first_name || user.firstName,
          last_name: user.last_name || user.lastName
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

  const register = async (email, password, firstName, lastName, phone, country) => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phone,
        country
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
      const response = await api.get('/api/auth/profile')
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data
        // Normalizar campos do backend para o formato do frontend
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
          balance: userData.balance,
          totalInvested: userData.total_invested,
          totalProfit: userData.total_profit,
          profitPercentage: userData.profit_percentage,
          referralCode: userData.referral_code,
          street: userData.street,
          number: userData.number,
          neighborhood: userData.neighborhood,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zip_code,
          zip_code: userData.zip_code,
          complement: userData.complement
        }
        setUser(normalizedUser)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        return { success: true, user: normalizedUser }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erro ao obter perfil.' 
        }
      }
    } catch (error) {
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
          balance: userData.balance,
          totalInvested: userData.total_invested,
          totalProfit: userData.total_profit,
          profitPercentage: userData.profit_percentage,
          referralCode: userData.referral_code,
          street: userData.street,
          number: userData.number,
          neighborhood: userData.neighborhood,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zip_code,
          zip_code: userData.zip_code,
          complement: userData.complement
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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
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
