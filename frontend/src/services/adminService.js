import api from './api'

// Obter todos os usuários com informações agregadas (Admin)
export const getAllUsers = async () => {
  try {
    const response = await api.get('/api/admin/users')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar usuários.',
      error: error.response?.data
    }
  }
}

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

// Atualizar email MyFXBook de um usuário (Admin)
export const updateMyfxbookEmail = async (userId, email) => {
  try {
    const response = await api.put(`/api/admin/myfxbook-connections/${userId}/email`, {
      email
    })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar email MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar email MyFXBook.',
      error: error.response?.data
    }
  }
}

// Atualizar controles operacionais de uma conta MT4 (Admin)
export const updateOperationalControls = async (accountId, automationEnabled, riskProfile) => {
  try {
    const response = await api.put(`/api/admin/mt4-accounts/${accountId}/operational-controls`, {
      automation_enabled: automationEnabled,
      risk_profile: riskProfile
    })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar controles operacionais:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar controles operacionais.',
      error: error.response?.data
    }
  }
}

// Configurar credenciais padrão do sistema MyFXBook (Admin)
export const setSystemMyfxbookConfig = async (email, password) => {
  try {
    const response = await api.post('/api/admin/system/myfxbook-config', {
      email,
      password
    })
    return {
      success: response.data.success,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao configurar credenciais padrão MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao configurar credenciais padrão MyFXBook.',
      error: error.response?.data
    }
  }
}

// Obter configuração padrão do sistema MyFXBook (Admin)
export const getSystemMyfxbookConfig = async () => {
  try {
    const response = await api.get('/api/admin/system/myfxbook-config')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar configuração padrão MyFXBook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar configuração padrão MyFXBook.',
      error: error.response?.data
    }
  }
}

// Obter dados MyFXBook por accountId (Admin)
export const getMyfxbookAccountDataByAccountId = async (accountId) => {
  try {
    const response = await api.get(`/api/admin/myfxbook/account/${accountId}/data`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar dados MyFXBook por accountId:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar dados MyFXBook.',
      error: error.response?.data
    }
  }
}

// Testar saúde da conexão MyFXBook do sistema (Admin)
export const testMyfxbookHealth = async () => {
  try {
    const response = await api.get('/api/admin/system/myfxbook-health')
    return {
      success: response.data.success,
      connected: response.data.connected,
      message: response.data.message,
      accountsCount: response.data.accountsCount,
      accounts: response.data.accounts
    }
  } catch (error) {
    console.error('Erro ao testar saúde MyFXBook:', error)
    return {
      success: false,
      connected: false,
      message: error.response?.data?.message || 'Erro ao testar conexão MyFXBook.',
      error: error.response?.data
    }
  }
}

// Testar integração MyFXBook de um usuário específico (Admin)
export const testUserMyfxbookIntegration = async (userId) => {
  try {
    const response = await api.get(`/api/admin/users/${userId}/myfxbook-test`)
    return {
      success: response.data.success,
      connected: response.data.connected,
      message: response.data.message,
      account: response.data.account,
      canFetchData: response.data.canFetchData,
      availableAccounts: response.data.availableAccounts
    }
  } catch (error) {
    console.error('Erro ao testar integração MyFXBook do usuário:', error)
    return {
      success: false,
      connected: false,
      message: error.response?.data?.message || 'Erro ao testar integração MyFXBook.',
      error: error.response?.data
    }
  }
}

// Gerenciamento de Planos (Admin)
export const getAllPlans = async () => {
  try {
    const response = await api.get('/api/admin/plans')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar planos.',
      error: error.response?.data
    }
  }
}

export const createPlan = async (planData) => {
  try {
    const response = await api.post('/api/admin/plans', planData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao criar plano.',
      error: error.response?.data
    }
  }
}

export const updatePlan = async (planId, planData) => {
  try {
    const response = await api.put(`/api/admin/plans/${planId}`, planData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar plano.',
      error: error.response?.data
    }
  }
}

export const deletePlan = async (planId) => {
  try {
    const response = await api.delete(`/api/admin/plans/${planId}`)
    return {
      success: response.data.success,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao deletar plano:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao deletar plano.',
      error: error.response?.data
    }
  }
}

export const updateUserPlan = async (userId, planId) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}/plan`, {
      plan_id: planId
    })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar plano do usuário:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar plano do usuário.',
      error: error.response?.data
    }
  }
}


