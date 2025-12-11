import api from './api'

// Atualizar perfil do usuário
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/api/auth/profile', profileData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    const errorData = error.response?.data
    
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
      return { 
        success: false, 
        message: validationErrors, 
        errors: errorData.errors 
      }
    }
    
    return {
      success: false,
      message: errorData?.message || 'Erro ao atualizar perfil. Tente novamente.',
      error: errorData
    }
  }
}

// Atualizar senha
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/api/auth/password', {
      currentPassword,
      newPassword
    })
    return {
      success: response.data.success,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error)
    const errorData = error.response?.data
    
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const validationErrors = errorData.errors.map(err => err.message || err.msg).join(', ')
      return { 
        success: false, 
        message: validationErrors, 
        errors: errorData.errors 
      }
    }
    
    return {
      success: false,
      message: errorData?.message || 'Erro ao atualizar senha. Tente novamente.',
      error: errorData
    }
  }
}
