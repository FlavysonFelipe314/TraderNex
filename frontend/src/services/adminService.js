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

// Deletar usuário (Admin)
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/admin/users/${userId}`)
    return {
      success: response.data.success,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao deletar usuário.',
      error: error.response?.data
    }
  }
}

// Obter todos os interessados em cripto (Admin)
export const getCryptoInterested = async (page = 1, limit = 50, notified = null) => {
  try {
    const params = new URLSearchParams({ page, limit })
    if (notified !== null) {
      params.append('notified', notified)
    }
    const response = await api.get(`/api/admin/crypto/interested?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      pagination: response.data.pagination,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar interessados em cripto:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar interessados.',
      error: error.response?.data
    }
  }
}

// Marcar interessado como notificado (Admin)
export const markCryptoInterestedAsNotified = async (id) => {
  try {
    const response = await api.put(`/api/admin/crypto/interested/${id}/notify`)
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    }
  } catch (error) {
    console.error('Erro ao marcar como notificado:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao marcar como notificado.',
      error: error.response?.data
    }
  }
}

// ========== Gerenciamento de Comissões e Pagamentos (Admin) ==========

// Obter todas as comissões de indicações (Admin)
export const getAllReferralCommissions = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.commission_paid !== undefined) params.append('commission_paid', filters.commission_paid)
    if (filters.referrer_id) params.append('referrer_id', filters.referrer_id)
    
    const response = await api.get(`/api/admin/referrals/commissions?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar comissões:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar comissões.',
      error: error.response?.data
    }
  }
}

// Aprovar pagamento de comissão (Admin)
export const approveCommissionPayment = async (referralId) => {
  try {
    const response = await api.post(`/api/admin/referrals/${referralId}/approve-payment`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao aprovar pagamento:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao aprovar pagamento.',
      error: error.response?.data
    }
  }
}

// Rejeitar pagamento de comissão (Admin)
export const rejectCommissionPayment = async (referralId, reason) => {
  try {
    const response = await api.post(`/api/admin/referrals/${referralId}/reject-payment`, { reason })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao rejeitar pagamento:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao rejeitar pagamento.',
      error: error.response?.data
    }
  }
}

// Obter estatísticas de comissões (Admin)
export const getReferralCommissionStats = async () => {
  try {
    const response = await api.get('/api/admin/referrals/stats')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de comissões:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar estatísticas.',
      error: error.response?.data
    }
  }
}

// Processar lucro manualmente (Admin)
export const processProfitManually = async (userId, profit, investmentAmount, type = 'investment') => {
  try {
    const endpoint = type === 'mt4' 
      ? '/api/admin/process-mt4-profit'
      : '/api/admin/process-investment-profit'
    
    const response = await api.post(endpoint, {
      userId,
      profit,
      investmentAmount
    })
    return {
      success: response.data.success,
      data: response.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao processar lucro manualmente:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao processar lucro.',
      error: error.response?.data
    }
  }
}

// Processar comissões semanais (Admin)
export const processWeeklyCommissions = async () => {
  try {
    const response = await api.post('/api/admin/referrals/process-weekly')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao processar comissões semanais:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao processar comissões semanais.',
      error: error.response?.data
    }
  }
}

// ========== Gerenciamento de Faturas (Admin) ==========

// Obter todas as faturas (Admin)
export const getAllInvoices = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.period) params.append('period', filters.period)
    
    const response = await api.get(`/api/admin/invoices?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      stats: response.data.stats,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar faturas:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar faturas.',
      error: error.response?.data
    }
  }
}

// Obter estatísticas de faturas (Admin)
export const getInvoiceStats = async () => {
  try {
    const response = await api.get('/api/admin/invoices/stats')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de faturas:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar estatísticas.',
      error: error.response?.data
    }
  }
}

// Marcar fatura como paga (Admin)
export const markInvoiceAsPaidAdmin = async (invoiceId, paidDate) => {
  try {
    const response = await api.post(`/api/admin/invoices/${invoiceId}/mark-paid`, { paidDate })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao marcar fatura como paga:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao marcar fatura como paga.',
      error: error.response?.data
    }
  }
}

// Obter sugestão de fatura para um usuário (Admin)
export const getInvoiceSuggestion = async (userId, periodStart, periodEnd) => {
  try {
    const params = new URLSearchParams()
    if (periodStart) params.append('periodStart', periodStart)
    if (periodEnd) params.append('periodEnd', periodEnd)
    
    const response = await api.get(`/api/admin/invoices/suggest/${userId}?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar sugestão de fatura:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar sugestão de fatura.',
      error: error.response?.data
    }
  }
}

// Criar fatura manualmente (Admin)
export const createInvoiceManual = async (invoiceData) => {
  try {
    const response = await api.post('/api/admin/invoices/create-manual', invoiceData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao criar fatura manual:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao criar fatura manual.',
      error: error.response?.data
    }
  }
}


