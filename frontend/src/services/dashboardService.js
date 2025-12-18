import api from './api'

// Obter dados do dashboard
// Obter dados do dashboard
export const getDashboardData = async (period = '30d') => {
  try {
    const response = await api.get(`/api/dashboard/overview?period=${period}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar dados do dashboard.',
      error: error.response?.data
    }
  }
}

// Obter estatísticas de performance
export const getPerformanceStats = async (period = '30d') => {
  try {
    const response = await api.get(`/api/dashboard/performance?period=${period}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de performance:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar estatísticas de performance.',
      error: error.response?.data
    }
  }
}

// Obter contas MT4
export const getMT4Accounts = async () => {
  try {
    const response = await api.get('/api/dashboard/mt4-accounts')
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

// Adicionar conta MT4
export const addMT4Account = async (accountData) => {
  try {
    const response = await api.post('/api/dashboard/mt4-accounts', accountData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao adicionar conta MT4:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao adicionar conta MT4.',
      error: error.response?.data
    }
  }
}

// Atualizar configurações operacionais da conta MT4
export const updateMT4Settings = async (accountId, settings) => {
  try {
    const response = await api.put(`/api/dashboard/mt4-accounts/${accountId}/settings`, settings)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações MT4:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar configurações.',
      error: error.response?.data
    }
  }
}

// Obter planos de investimento
export const getInvestmentPlans = async () => {
  try {
    const response = await api.get('/api/dashboard/investment-plans')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar planos de investimento:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar planos de investimento.',
      error: error.response?.data
    }
  }
}

// Obter investimentos do usuário
export const getUserInvestments = async () => {
  try {
    const response = await api.get('/api/dashboard/investments')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar investimentos:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar investimentos.',
      error: error.response?.data
    }
  }
}

// Obter transações
export const getTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)

    const response = await api.get(`/api/dashboard/transactions?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar transações.',
      error: error.response?.data
    }
  }
}

// Obter faturas
export const getInvoices = async () => {
  try {
    const response = await api.get('/api/dashboard/invoices')
    return {
      success: response.data.success,
      data: response.data.data,
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

// Obter dados de indicações
export const getReferrals = async () => {
  try {
    const response = await api.get('/api/dashboard/referrals')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar dados de indicações:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar dados de indicações.',
      error: error.response?.data
    }
  }
}

// Conectar conta Myfxbook
export const connectMyfxbook = async (email, password) => {
  try {
    const response = await api.post('/api/myfxbook/connect', { email, password })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao conectar Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao conectar conta Myfxbook.',
      error: error.response?.data
    }
  }
}

// Desconectar conta Myfxbook
export const disconnectMyfxbook = async (deleteCredentials = false) => {
  try {
    const response = await api.post('/api/myfxbook/disconnect', { deleteCredentials })
    return {
      success: response.data.success,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao desconectar Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao desconectar conta Myfxbook.',
      error: error.response?.data
    }
  }
}

// Obter status da conexão Myfxbook
export const getMyfxbookStatus = async () => {
  try {
    const response = await api.get('/api/myfxbook/status')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar status Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar status da conexão Myfxbook.',
      error: error.response?.data
    }
  }
}

// Obter contas do Myfxbook
export const getMyfxbookAccounts = async () => {
  try {
    const response = await api.get('/api/myfxbook/accounts')
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar contas Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar contas do Myfxbook.',
      error: error.response?.data
    }
  }
}

// Obter dados de uma conta específica
export const getMyfxbookAccountData = async (accountId, startDate, endDate) => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/api/myfxbook/accounts/${accountId}/data?${params.toString()}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar dados da conta Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar dados da conta.',
      error: error.response?.data
    }
  }
}

// Obter dados completos do Myfxbook (contas, trades, histórico)
export const getMyfxbookFullData = async (accountId) => {
  try {
    // Calcular datas (últimos 30 dias)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const response = await api.get(`/api/myfxbook/accounts/${accountId}/data?startDate=${startDateStr}&endDate=${endDateStr}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar dados completos Myfxbook:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar dados completos.',
      error: error.response?.data
    }
  }
}