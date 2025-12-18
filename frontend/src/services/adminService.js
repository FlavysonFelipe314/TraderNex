import api from './api'

// Obter todas as contas MT4 (Admin)
export const getAllMT4Accounts = async () => {
  try {
    const response = await api.get('/api/admin/mt4-accounts')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar contas MT4:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar contas MT4.',
      error: error.response?.data
    }
  }
}

// Atualizar login de integração MyFXBook (Admin)
export const updateMyfxbookIntegrationLogin = async (accountId, myfxbookIntegrationLogin) => {
  try {
    const response = await api.put(`/api/admin/mt4-accounts/${accountId}/myfxbook-login`, {
      myfxbook_integration_login: myfxbookIntegrationLogin
    })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar login de integração MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar login de integração MyFXBook.',
      error: error.response?.data
    }
  }
}

// Obter todas as conexões MyFXBook (Admin)
export const getAllMyfxbookConnections = async () => {
  try {
    const response = await api.get('/api/admin/myfxbook-connections')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar conexões MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar conexões MyFXBook.',
      error: error.response?.data
    }
  }
}

// Atualizar senha MyFXBook de um usuário (Admin)
export const updateMyfxbookPassword = async (userId, password) => {
  try {
    const response = await api.put(`/api/admin/myfxbook-connections/${userId}/password`, {
      password
    })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar senha MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar senha MyFXBook.',
      error: error.response?.data
    }
  }
}


