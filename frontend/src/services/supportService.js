import api from './api'

// Criar ticket de suporte
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/api/support/tickets', ticketData)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao criar ticket:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao criar ticket.',
      error: error.response?.data
    }
  }
}

// Obter tickets do usuário
export const getUserTickets = async (status = null) => {
  try {
    const url = status 
      ? `/api/support/tickets?status=${status}`
      : '/api/support/tickets'
    
    const response = await api.get(url)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar tickets:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar tickets.',
      error: error.response?.data
    }
  }
}

// Obter detalhes de um ticket
export const getTicketDetails = async (ticketId) => {
  try {
    const response = await api.get(`/api/support/tickets/${ticketId}`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes do ticket:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar detalhes do ticket.',
      error: error.response?.data
    }
  }
}

// Adicionar resposta a um ticket
export const addTicketResponse = async (ticketId, message) => {
  try {
    const response = await api.post(`/api/support/tickets/${ticketId}/responses`, { message })
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao adicionar resposta.',
      error: error.response?.data
    }
  }
}

// Fechar ticket
export const closeTicket = async (ticketId) => {
  try {
    const response = await api.patch(`/api/support/tickets/${ticketId}/close`)
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
  } catch (error) {
    console.error('Erro ao fechar ticket:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao fechar ticket.',
      error: error.response?.data
    }
  }
}
