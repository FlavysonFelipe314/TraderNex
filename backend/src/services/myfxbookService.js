const axios = require('axios');

const MYFXBOOK_API_BASE = 'https://www.myfxbook.com/api';

/**
 * Faz login na API do Myfxbook
 * @param {string} email - Email do usuário Myfxbook
 * @param {string} password - Senha do usuário Myfxbook
 * @returns {Promise<Object>} Objeto com session ID ou erro
 */
/**
 * Faz login na API do Myfxbook
 * @param {string} email - Email do usuário Myfxbook
 * @param {string} password - Senha do usuário Myfxbook
 * @param {number} initialDelay - Delay inicial em ms antes da primeira tentativa (opcional, padrão: 0)
 * @returns {Promise<Object>} Objeto com session ID ou erro
 */
async function loginMyfxbook(email, password, initialDelay = 0) {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: 'Email e senha são obrigatórios'
      };
    }

    if (initialDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, initialDelay));
    }
    
    const emailParam = encodeURIComponent(email);
    const passwordParam = encodeURIComponent(password);
    const url = `${MYFXBOOK_API_BASE}/login.json?email=${emailParam}&password=${passwordParam}`;
    
    console.log(`[Myfxbook] Login: ${email}`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    console.log(`[Myfxbook] Resposta - Status: ${response.status}, Session: ${response.data?.session ? response.data.session.substring(0, 50) + '...' : 'NÃO'}`);
    
    if (response.status === 200 && response.data && response.data.session) {
      console.log(`[Myfxbook] Login OK! Session: ${response.data.session.substring(0, 50)}...`);
      return {
        success: true,
        session: response.data.session,
        message: 'Login realizado com sucesso'
      };
    }

    if (response.status >= 400 && response.status < 500) {
      let errorMessage = `Erro HTTP ${response.status}`;
      
      if (response.status === 403) {
        errorMessage = 'Acesso negado (403 Forbidden). Verifique credenciais ou aguarde alguns minutos.';
      } else if (response.status === 401) {
        errorMessage = 'Credenciais inválidas. Verifique email e senha.';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Aguarde alguns minutos.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: response.data,
        status: response.status
      };
    }

    if (response.data?.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao fazer login',
        error: response.data
      };
    }

    if (!response.data?.session) {
      return {
        success: false,
        message: 'Session não encontrada na resposta. Verifique credenciais.',
        error: response.data
      };
    }

    return {
      success: true,
      session: response.data.session,
      message: 'Login realizado com sucesso'
    };
  } catch (error) {
    console.error('[Myfxbook] Erro:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Erro de conexão',
      error: error.message
    };
  }
}

/**
 * Faz logout da API do Myfxbook
 * @param {string} session - Session ID do Myfxbook
 * @returns {Promise<Object>} Resultado do logout
 */
async function logoutMyfxbook(session) {
  try {
    const response = await axios.get(`${MYFXBOOK_API_BASE}/logout.json`, {
      params: { session }
    });

    return {
      success: !response.data.error,
      message: response.data.message || 'Logout realizado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao fazer logout no Myfxbook:', error);
    return {
      success: false,
      message: 'Erro ao fazer logout no Myfxbook',
      error: error.message
    };
  }
}

/**
 * Obtém lista de contas do Myfxbook
 * @param {string} session - Session ID do Myfxbook
 * @returns {Promise<Object>} Lista de contas
 */
async function getMyAccounts(session) {
  try {
    console.log(`[Myfxbook] Buscando contas com session: ${session ? session.substring(0, 30) + '...' : 'null'}`);
    console.log(`[Myfxbook] Session completa (primeiros 50 chars): ${session ? session.substring(0, 50) : 'null'}`);
    console.log(`[Myfxbook] Session length: ${session ? session.length : 0}`);
    
    const url = `${MYFXBOOK_API_BASE}/get-my-accounts.json`;
    console.log(`[Myfxbook] URL: ${url}`);
    
    // IMPORTANTE: A sessão já vem URL-encoded da API do MyFXBook
    // Não devemos codificar novamente, apenas usar diretamente
    // Se a sessão contiver caracteres codificados (%2F, %3D, etc), eles já estão corretos
    const fullUrl = `${url}?session=${session}`;
    console.log(`[Myfxbook] Full URL (primeiros 100 chars): ${fullUrl.substring(0, 100)}...`);
    
    const response = await axios.get(fullUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      // Não usar params, já que construímos a URL manualmente
      validateStatus: function (status) {
        return status < 500; // Aceitar qualquer status < 500 para ver a resposta
      }
    });

    console.log(`[Myfxbook] Resposta get-my-accounts:`, {
      status: response.status,
      hasError: response.data.error,
      hasAccounts: !!response.data.accounts,
      accountsCount: response.data.accounts ? response.data.accounts.length : 0,
      message: response.data.message
    });

    if (response.data.error) {
      console.error(`[Myfxbook] Erro na resposta get-my-accounts:`, response.data);
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar contas',
        error: response.data
      };
    }

    const accounts = response.data.accounts || [];
    console.log(`[Myfxbook] Contas obtidas com sucesso! Total: ${accounts.length}`);
    
    return {
      success: true,
      accounts: accounts,
      message: 'Contas obtidas com sucesso'
    };
  } catch (error) {
    console.error('[Myfxbook] Erro ao buscar contas:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Erro ao buscar contas do Myfxbook',
      error: error.message
    };
  }
}

/**
 * Obtém trades abertos de uma conta
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @returns {Promise<Object>} Lista de trades abertos
 */
async function getOpenTrades(session, accountId) {
  try {
    // IMPORTANTE: A sessão já vem URL-encoded da API do MyFXBook, não codificar novamente
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-open-trades.json?session=${session}&id=${accountParam}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar trades abertos',
        error: response.data
      };
    }

    return {
      success: true,
      trades: response.data.openTrades || [],
      message: 'Trades abertos obtidos com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar trades abertos:', error);
    return {
      success: false,
      message: 'Erro ao buscar trades abertos',
      error: error.message
    };
  }
}

/**
 * Obtém histórico de trades
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @returns {Promise<Object>} Histórico de trades
 */
async function getHistory(session, accountId) {
  try {
    console.log(`[Myfxbook] Buscando histórico para accountId: ${accountId}`);
    // IMPORTANTE: A sessão já vem URL-encoded da API do MyFXBook, não codificar novamente
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-history.json?session=${session}&id=${accountParam}`;
    
    console.log(`[Myfxbook] URL get-history (primeiros 100 chars): ${url.substring(0, 100)}...`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log(`[Myfxbook] Resposta get-history:`, {
      status: response.status,
      hasError: response.data.error,
      hasHistory: !!response.data.history,
      historyLength: response.data.history ? response.data.history.length : 0,
      message: response.data.message
    });

    if (response.data.error) {
      console.error(`[Myfxbook] Erro na resposta get-history:`, response.data);
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar histórico',
        error: response.data
      };
    }

    const historyData = response.data.history || [];
    console.log(`[Myfxbook] Histórico obtido com sucesso! Total de registros: ${historyData.length}`);
    if (historyData.length > 0) {
      console.log(`[Myfxbook] Primeiro registro do histórico:`, {
        symbol: historyData[0].symbol,
        side: historyData[0].side,
        profit: historyData[0].profit,
        openTime: historyData[0].openTime,
        closeTime: historyData[0].closeTime
      });
    }

    return {
      success: true,
      history: historyData,
      message: 'Histórico obtido com sucesso'
    };
  } catch (error) {
    console.error('[Myfxbook] Erro ao buscar histórico:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    return {
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    };
  }
}

/**
 * Obtém ganho diário
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @param {string} startDate - Data inicial (yyyy-mm-dd)
 * @param {string} endDate - Data final (yyyy-mm-dd)
 * @returns {Promise<Object>} Dados de ganho diário
 */
async function getDailyGain(session, accountId, startDate, endDate) {
  try {
    // IMPORTANTE: A sessão já vem URL-encoded da API do MyFXBook, não codificar novamente
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-daily-gain.json?session=${session}&id=${accountParam}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar ganho diário',
        error: response.data
      };
    }

    return {
      success: true,
      dailyGain: response.data.dailyGain || [],
      message: 'Ganho diário obtido com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar ganho diário:', error);
    return {
      success: false,
      message: 'Erro ao buscar ganho diário',
      error: error.message
    };
  }
}

/**
 * Obtém dados diários da conta
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @param {string} startDate - Data inicial (yyyy-mm-dd)
 * @param {string} endDate - Data final (yyyy-mm-dd)
 * @returns {Promise<Object>} Dados diários
 */
async function getDataDaily(session, accountId, startDate, endDate) {
  try {
    // IMPORTANTE: A sessão já vem URL-encoded da API do MyFXBook, não codificar novamente
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-data-daily.json?session=${session}&id=${accountParam}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar dados diários',
        error: response.data
      };
    }

    // A API pode retornar array aninhado, então vamos desaninhar se necessário
    let dataDaily = response.data.dataDaily || [];
    if (dataDaily.length > 0 && Array.isArray(dataDaily[0])) {
      dataDaily = dataDaily.flat();
    }

    console.log('[Myfxbook] getDataDaily - Dados recebidos:', {
      total: dataDaily.length,
      firstItem: dataDaily[0],
      hasProfit: dataDaily[0]?.profit !== undefined
    });

    return {
      success: true,
      dataDaily: dataDaily,
      message: 'Dados diários obtidos com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar dados diários:', error);
    return {
      success: false,
      message: 'Erro ao buscar dados diários',
      error: error.message
    };
  }
}

/**
 * Obtém ordens abertas de uma conta
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @returns {Promise<Object>} Lista de ordens abertas
 */
async function getOpenOrders(session, accountId) {
  try {
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-open-orders.json?session=${session}&id=${accountParam}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar ordens abertas',
        error: response.data
      };
    }

    return {
      success: true,
      openOrders: response.data.openOrders || [],
      message: 'Ordens abertas obtidas com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar ordens abertas:', error);
    return {
      success: false,
      message: 'Erro ao buscar ordens abertas',
      error: error.message
    };
  }
}

/**
 * Obtém ganho total em um período
 * @param {string} session - Session ID do Myfxbook
 * @param {string} accountId - ID da conta
 * @param {string} startDate - Data inicial (yyyy-mm-dd)
 * @param {string} endDate - Data final (yyyy-mm-dd)
 * @returns {Promise<Object>} Ganho total
 */
async function getGain(session, accountId, startDate, endDate) {
  try {
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-gain.json?session=${session}&id=${accountParam}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar ganho',
        error: response.data
      };
    }

    return {
      success: true,
      value: response.data.value || 0,
      message: 'Ganho obtido com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar ganho:', error);
    return {
      success: false,
      message: 'Erro ao buscar ganho',
      error: error.message
    };
  }
}

/**
 * Obtém contas assistidas (watched accounts)
 * @param {string} session - Session ID do Myfxbook
 * @returns {Promise<Object>} Lista de contas assistidas
 */
async function getWatchedAccounts(session) {
  try {
    const url = `${MYFXBOOK_API_BASE}/get-watched-accounts.json?session=${session}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar contas assistidas',
        error: response.data
      };
    }

    return {
      success: true,
      watchedAccounts: response.data.watchedAccounts || [],
      message: 'Contas assistidas obtidas com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar contas assistidas:', error);
    return {
      success: false,
      message: 'Erro ao buscar contas assistidas',
      error: error.message
    };
  }
}

/**
 * Obtém sentimento da comunidade
 * @param {string} session - Session ID do Myfxbook
 * @returns {Promise<Object>} Sentimento da comunidade
 */
async function getCommunityOutlook(session) {
  try {
    const url = `${MYFXBOOK_API_BASE}/get-community-outlook.json?session=${session}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar sentimento da comunidade',
        error: response.data
      };
    }

    return {
      success: true,
      symbols: response.data.symbols || [],
      general: response.data.general || {},
      message: 'Sentimento da comunidade obtido com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar sentimento da comunidade:', error);
    return {
      success: false,
      message: 'Erro ao buscar sentimento da comunidade',
      error: error.message
    };
  }
}

/**
 * Obtém sentimento da comunidade por país
 * @param {string} session - Session ID do Myfxbook
 * @param {string} symbol - Símbolo (ex: eurusd)
 * @returns {Promise<Object>} Sentimento por país
 */
async function getCommunityOutlookByCountry(session, symbol) {
  try {
    const symbolParam = encodeURIComponent(symbol);
    const url = `${MYFXBOOK_API_BASE}/get-community-outlook-by-country.json?session=${session}&symbol=${symbolParam}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.data.error) {
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar sentimento por país',
        error: response.data
      };
    }

    return {
      success: true,
      countries: response.data.countries || [],
      message: 'Sentimento por país obtido com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar sentimento por país:', error);
    return {
      success: false,
      message: 'Erro ao buscar sentimento por país',
      error: error.message
    };
  }
}

module.exports = {
  loginMyfxbook,
  logoutMyfxbook,
  getMyAccounts,
  getOpenTrades,
  getOpenOrders,
  getHistory,
  getDailyGain,
  getGain,
  getDataDaily,
  getWatchedAccounts,
  getCommunityOutlook,
  getCommunityOutlookByCountry
};

