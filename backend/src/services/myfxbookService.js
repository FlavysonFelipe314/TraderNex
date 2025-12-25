const axios = require('axios');

const MYFXBOOK_API_BASE = 'https://www.myfxbook.com/api';

// Puppeteer será carregado dinamicamente apenas quando necessário
let puppeteer = null;
async function getPuppeteer() {
  if (!puppeteer) {
    try {
      puppeteer = require('puppeteer');
    } catch (error) {
      console.warn('[Myfxbook] Puppeteer não está instalado. Execute: npm install puppeteer');
      return null;
    }
  }
  return puppeteer;
}

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
    
    // Tentar primeiro com axios (REST simples)
    try {
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

      // Se for 403, tentar com Puppeteer
      if (response.status === 403) {
        console.log('[Myfxbook] Erro 403 detectado, tentando com Puppeteer...');
        return await loginMyfxbookWithPuppeteer(email, password);
      }

      if (response.status >= 400 && response.status < 500) {
        let errorMessage = `Erro HTTP ${response.status}`;
        
        if (response.status === 401) {
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
    } catch (error) {
      // Se axios falhar, tentar com Puppeteer
      if (error.response?.status === 403 || error.code === 'ECONNREFUSED') {
        console.log('[Myfxbook] Erro no axios, tentando com Puppeteer...');
        return await loginMyfxbookWithPuppeteer(email, password);
      }
      throw error;
    }
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
 * Faz login usando Puppeteer para contornar desafio do Cloudflare
 */
async function loginMyfxbookWithPuppeteer(email, password) {
  let browser = null;
  try {
    const puppeteerLib = await getPuppeteer();
    if (!puppeteerLib) {
      return {
        success: false,
        message: 'Puppeteer não está instalado. Execute: npm install puppeteer'
      };
    }

    console.log('[Myfxbook Puppeteer] Iniciando navegador...');
    
    // Configuração para Alpine Linux (produção)
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable'
    ];
    
    let executablePath = undefined;
    const fs = require('fs');
    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        executablePath = path;
        console.log(`[Myfxbook Puppeteer] Chromium encontrado em: ${path}`);
        break;
      }
    }
    
    browser = await puppeteerLib.launch({
      headless: 'new', // Usar novo modo headless que é mais rápido
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-images', // Não carregar imagens para ser mais rápido
        '--disable-javascript-harmony-shipping',
        '--disable-background-networking'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const emailParam = encodeURIComponent(email);
    const passwordParam = encodeURIComponent(password);
    const loginUrl = `${MYFXBOOK_API_BASE}/login.json?email=${emailParam}&password=${passwordParam}`;
    
    console.log('[Myfxbook Puppeteer] Acessando URL de login...');
    
    // Navegar e aguardar resposta JSON (usar domcontentloaded que é mais rápido)
    await page.goto(loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Aguardar um pouco para garantir que o JavaScript foi executado (reduzido de 3s para 1s)
    await page.waitForTimeout(1000);

    // Obter o conteúdo da página
    const content = await page.content();
    
    // Tentar extrair JSON da resposta
    let jsonData = null;
    try {
      // Tentar fazer fetch via JavaScript na página
      const responseText = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url);
          return await response.text();
        } catch (e) {
          return null;
        }
      }, loginUrl);
      
      if (responseText) {
        jsonData = JSON.parse(responseText);
      }
    } catch (e) {
      // Se falhar, tentar extrair do body
      try {
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText && bodyText.trim().startsWith('{')) {
          jsonData = JSON.parse(bodyText);
        }
      } catch (e2) {
        console.warn('[Myfxbook Puppeteer] Não foi possível parsear JSON da página');
      }
    }

    if (jsonData && jsonData.session) {
      console.log(`[Myfxbook Puppeteer] Login OK! Session: ${jsonData.session.substring(0, 50)}...`);
      return {
        success: true,
        session: jsonData.session,
        message: 'Login realizado com sucesso via Puppeteer'
      };
    }

    if (jsonData && jsonData.error) {
      return {
        success: false,
        message: jsonData.message || 'Erro ao fazer login',
        error: jsonData
      };
    }

    return {
      success: false,
      message: 'Não foi possível obter session do MyFXBook via Puppeteer',
      error: 'Resposta inválida'
    };

  } catch (error) {
    console.error('[Myfxbook Puppeteer] Erro:', error.message);
    return {
      success: false,
      message: 'Erro ao fazer login com Puppeteer: ' + error.message,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
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
    console.log(`[Myfxbook] Buscando contas - Session: ${session ? session.substring(0, 50) + '...' : 'null'}`);
    
    const url = `${MYFXBOOK_API_BASE}/get-my-accounts.json`;
    // IMPORTANTE: A session já vem URL-encoded do MyFXBook, não codificar novamente!
    // Se codificar novamente, %2B vira %252B e a session fica inválida
    const fullUrl = `${url}?session=${session}`;
    
    console.log(`[Myfxbook] URL completa (primeiros 150 chars): ${fullUrl.substring(0, 150)}...`);
    
    // Tentar primeiro com axios
    try {
      const response = await axios.get(fullUrl, {
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`[Myfxbook] Resposta - Status: ${response.status}`);
      console.log(`[Myfxbook] Resposta completa:`, JSON.stringify(response.data, null, 2));
      console.log(`[Myfxbook] Chaves da resposta:`, Object.keys(response.data || {}));
      console.log(`[Myfxbook] Contas (accounts): ${response.data?.accounts ? response.data.accounts.length : 'não existe'}`);
      console.log(`[Myfxbook] Tipo de accounts:`, typeof response.data?.accounts);

      if (response.status === 200 && response.data && !response.data.error) {
        // Verificar diferentes possíveis campos
        let accounts = response.data.accounts || response.data.Accounts || response.data.data || [];
        
        // Se accounts não é array, tentar converter
        if (accounts && !Array.isArray(accounts)) {
          if (typeof accounts === 'object') {
            // Pode ser um objeto com contas dentro
            accounts = Object.values(accounts).find(v => Array.isArray(v)) || [];
          } else {
            accounts = [];
          }
        }
        
        console.log(`[Myfxbook] Contas processadas: ${accounts.length}`);
        console.log(`[Myfxbook] Todas as contas:`, JSON.stringify(accounts, null, 2));
        
        if (accounts.length > 0) {
          console.log(`[Myfxbook] Primeira conta:`, {
            id: accounts[0].id,
            name: accounts[0].name,
            accountId: accounts[0].accountId,
            accountNumber: accounts[0].accountNumber,
            broker: accounts[0].broker,
            todasChaves: Object.keys(accounts[0] || {})
          });
        }
        
        return {
          success: true,
          accounts: accounts,
          message: 'Contas obtidas com sucesso'
        };
      }

      if (response.data?.error) {
        console.error(`[Myfxbook] Erro na resposta:`, response.data);
        return {
          success: false,
          message: response.data.message || 'Erro ao buscar contas',
          error: response.data
        };
      }

      // Se status 403, tentar com Puppeteer
      if (response.status === 403) {
        console.log('[Myfxbook] Erro 403, tentando com Puppeteer...');
        return await getMyAccountsWithPuppeteer(session);
      }

      return {
        success: false,
        message: 'Resposta inválida ao buscar contas',
        error: response.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('[Myfxbook] Erro 403 no axios, tentando com Puppeteer...');
        return await getMyAccountsWithPuppeteer(session);
      }
      throw error;
    }
  } catch (error) {
    console.error('[Myfxbook] Erro ao buscar contas:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Erro ao buscar contas do Myfxbook',
      error: error.message
    };
  }
}

/**
 * Busca contas usando Puppeteer
 */
async function getMyAccountsWithPuppeteer(session) {
  let browser = null;
  let page = null;
  try {
    const puppeteerLib = await getPuppeteer();
    if (!puppeteerLib) {
      return {
        success: false,
        message: 'Puppeteer não está instalado'
      };
    }

    console.log('[Myfxbook Puppeteer] Buscando contas...');
    
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    let executablePath = undefined;
    const fs = require('fs');
    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }
    
    browser = await puppeteerLib.launch({
      headless: 'new', // Usar novo modo headless que é mais rápido
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-images', // Não carregar imagens para ser mais rápido
        '--disable-javascript-harmony-shipping',
        '--disable-background-networking'
      ]
    });

    page = await browser.newPage();
    
    // Configurar timeout menor para ser mais rápido
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // IMPORTANTE: A session já vem URL-encoded do MyFXBook, não codificar novamente!
    // Se codificar novamente, %2B vira %252B e a session fica inválida
    const url = `${MYFXBOOK_API_BASE}/get-my-accounts.json?session=${session}`;
    
    console.log('[Myfxbook Puppeteer] Navegando para URL...');
    
    // Interceptar resposta da requisição
    let responseData = null;
    
    const responseHandler = async (response) => {
      const url_response = response.url();
      if (url_response.includes('get-my-accounts.json')) {
        try {
          const text = await response.text();
          if (text) {
            responseData = JSON.parse(text);
            console.log('[Myfxbook Puppeteer] Resposta interceptada:', {
              hasAccounts: !!responseData.accounts,
              accountsCount: responseData.accounts ? responseData.accounts.length : 0
            });
          }
        } catch (e) {
          console.warn('[Myfxbook Puppeteer] Erro ao parsear resposta interceptada:', e.message);
        }
      }
    };
    
    page.on('response', responseHandler);
    
    // Aguardar a navegação (usar domcontentloaded que é mais rápido)
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    // Aguardar um pouco para garantir que a resposta foi processada (reduzido de 3s para 1s)
    await page.waitForTimeout(1000);

    // Se não pegou pela interceptação, tentar obter do body
    if (!responseData) {
      console.log('[Myfxbook Puppeteer] Tentando obter dados do body...');
      try {
        const bodyText = await page.evaluate(() => {
          return document.body ? document.body.innerText : null;
        });
        
        if (bodyText && bodyText.trim().startsWith('{')) {
          responseData = JSON.parse(bodyText);
          console.log('[Myfxbook Puppeteer] Dados obtidos do body');
        }
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao obter do body:', e.message);
      }
    }

    // Se ainda não tem, tentar fazer fetch
    if (!responseData) {
      console.log('[Myfxbook Puppeteer] Tentando fazer fetch...');
      try {
        const fetchResult = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url);
            const text = await response.text();
            return text;
          } catch (e) {
            return null;
          }
        }, url);
        
        if (fetchResult) {
          responseData = JSON.parse(fetchResult);
          console.log('[Myfxbook Puppeteer] Dados obtidos via fetch');
        }
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro no fetch:', e.message);
      }
    }

    // Processar resposta antes de fechar navegador
    let result = null;
    
    console.log(`[Myfxbook Puppeteer] ResponseData completo:`, JSON.stringify(responseData, null, 2));
    console.log(`[Myfxbook Puppeteer] Chaves do responseData:`, responseData ? Object.keys(responseData) : 'null');
    
    if (responseData) {
      // Verificar diferentes possíveis campos
      let accounts = responseData.accounts || responseData.Accounts || responseData.data || [];
      
      // Se accounts não é array, tentar converter
      if (accounts && !Array.isArray(accounts)) {
        if (typeof accounts === 'object') {
          // Pode ser um objeto com contas dentro
          accounts = Object.values(accounts).find(v => Array.isArray(v)) || [];
        } else {
          accounts = [];
        }
      }
      
      if (accounts.length > 0) {
        console.log(`[Myfxbook Puppeteer] Contas obtidas: ${accounts.length}`);
        console.log(`[Myfxbook Puppeteer] Todas as contas:`, JSON.stringify(accounts, null, 2));
        console.log(`[Myfxbook Puppeteer] Primeira conta:`, {
          id: accounts[0].id,
          name: accounts[0].name,
          accountId: accounts[0].accountId,
          accountNumber: accounts[0].accountNumber,
          broker: accounts[0].broker,
          todasChaves: Object.keys(accounts[0] || {})
        });
        
        result = {
          success: true,
          accounts: accounts,
          message: 'Contas obtidas com sucesso via Puppeteer'
        };
      } else if (responseData.error) {
        result = {
          success: false,
          message: responseData.message || 'Erro ao buscar contas',
          error: responseData
        };
      } else {
        // Se não tem accounts mas também não tem error, pode ser que esteja em outro formato
        console.warn(`[Myfxbook Puppeteer] Resposta sem accounts e sem error:`, responseData);
        result = {
          success: false,
          message: 'Resposta recebida mas sem contas encontradas',
          error: responseData
        };
      }
    }
    
    // Fechar navegador
    if (browser) {
      try {
        if (page) {
          await page.close().catch(() => {});
        }
        await browser.close();
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao fechar navegador:', e.message);
      }
      browser = null;
      page = null;
    }
    
    if (result) {
      return result;
    }

    if (responseData && responseData.accounts) {
      const accounts = responseData.accounts || [];
      console.log(`[Myfxbook Puppeteer] Contas obtidas: ${accounts.length}`);
      
      if (accounts.length > 0) {
        console.log(`[Myfxbook Puppeteer] Primeira conta:`, {
          id: accounts[0].id,
          name: accounts[0].name,
          accountId: accounts[0].accountId
        });
      }
      
      return {
        success: true,
        accounts: accounts,
        message: 'Contas obtidas com sucesso via Puppeteer'
      };
    }

    if (responseData && responseData.error) {
      return {
        success: false,
        message: responseData.message || 'Erro ao buscar contas',
        error: responseData
      };
    }

    return {
      success: false,
      message: 'Não foi possível obter contas via Puppeteer',
      error: 'Resposta inválida'
    };

  } catch (error) {
    console.error('[Myfxbook Puppeteer] Erro ao buscar contas:', error.message);
    return {
      success: false,
      message: 'Erro ao buscar contas com Puppeteer: ' + error.message,
      error: error.message
    };
  } finally {
    // Garantir que o navegador seja fechado
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao fechar navegador:', e.message);
      }
    }
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
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log(`[Myfxbook] Resposta get-history - Status: ${response.status}`);

    // Se status 403, tentar com Puppeteer imediatamente (Cloudflare bloqueando)
    if (response.status === 403) {
      console.log('[Myfxbook] Erro 403 ao buscar histórico, tentando com Puppeteer...');
      return await getHistoryWithPuppeteer(session, accountId);
    }

    // Verificar se a resposta é HTML (Cloudflare challenge)
    const isHTML = typeof response.data === 'string' && (
      response.data.includes('Just a moment') ||
      response.data.includes('Enable JavaScript') ||
      response.data.includes('cf-challenge')
    );

    if (isHTML) {
      console.log('[Myfxbook] Resposta é HTML (Cloudflare), tentando com Puppeteer...');
      return await getHistoryWithPuppeteer(session, accountId);
    }

    if (response.status === 200 && response.data && !response.data.error) {
      const historyData = response.data.history || [];
      console.log(`[Myfxbook] Histórico obtido: ${historyData.length} registros`);
      
      if (historyData.length > 0) {
        console.log(`[Myfxbook] Primeiro registro:`, {
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
    }

    if (response.data?.error) {
      console.error(`[Myfxbook] Erro na resposta:`, response.data);
      return {
        success: false,
        message: response.data.message || 'Erro ao buscar histórico',
        error: response.data
      };
    }

    return {
      success: false,
      message: 'Resposta inválida ao buscar histórico',
      error: response.data
    };
  } catch (error) {
    // Se axios falhar com 403, tentar com Puppeteer
    if (error.response?.status === 403) {
      console.log('[Myfxbook] Erro 403 no axios, tentando com Puppeteer...');
      return await getHistoryWithPuppeteer(session, accountId);
    }
    
    console.error('[Myfxbook] Erro ao buscar histórico:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Erro ao buscar histórico',
      error: error.message
    };
  }
}

/**
 * Busca histórico usando Puppeteer
 */
async function getHistoryWithPuppeteer(session, accountId) {
  let browser = null;
  let page = null;
  try {
    const puppeteerLib = await getPuppeteer();
    if (!puppeteerLib) {
      return {
        success: false,
        message: 'Puppeteer não está instalado'
      };
    }

    console.log('[Myfxbook Puppeteer] Buscando histórico...');
    
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    let executablePath = undefined;
    const fs = require('fs');
    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }
    
    browser = await puppeteerLib.launch({
      headless: 'new',
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-images',
        '--disable-javascript-harmony-shipping',
        '--disable-background-networking'
      ]
    });

    page = await browser.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const accountParam = encodeURIComponent(accountId);
    const url = `${MYFXBOOK_API_BASE}/get-history.json?session=${session}&id=${accountParam}`;
    
    console.log('[Myfxbook Puppeteer] Navegando para URL...');
    
    // Interceptar resposta da requisição
    let responseData = null;
    
    const responseHandler = async (response) => {
      const url_response = response.url();
      if (url_response.includes('get-history.json')) {
        try {
          const text = await response.text();
          if (text) {
            responseData = JSON.parse(text);
            console.log('[Myfxbook Puppeteer] Resposta interceptada:', {
              hasHistory: !!responseData.history,
              historyCount: responseData.history ? responseData.history.length : 0
            });
          }
        } catch (e) {
          console.warn('[Myfxbook Puppeteer] Erro ao parsear resposta interceptada:', e.message);
        }
      }
    };
    
    page.on('response', responseHandler);
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    await page.waitForTimeout(1000);

    // Se não pegou pela interceptação, tentar obter do body
    if (!responseData) {
      try {
        const bodyText = await page.evaluate(() => {
          return document.body ? document.body.innerText : null;
        });
        
        if (bodyText && bodyText.trim().startsWith('{')) {
          responseData = JSON.parse(bodyText);
          console.log('[Myfxbook Puppeteer] Dados obtidos do body');
        }
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao obter do body:', e.message);
      }
    }

    // Se ainda não tem, tentar fazer fetch
    if (!responseData) {
      try {
        const fetchResult = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url);
            const text = await response.text();
            return text;
          } catch (e) {
            return null;
          }
        }, url);
        
        if (fetchResult) {
          responseData = JSON.parse(fetchResult);
          console.log('[Myfxbook Puppeteer] Dados obtidos via fetch');
        }
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro no fetch:', e.message);
      }
    }

    // Processar resposta antes de fechar navegador
    let result = null;
    
    if (responseData && responseData.history) {
      const history = responseData.history || [];
      console.log(`[Myfxbook Puppeteer] Histórico obtido: ${history.length} registros`);
      
      if (history.length > 0) {
        console.log(`[Myfxbook Puppeteer] Primeiro registro:`, {
          symbol: history[0].symbol,
          side: history[0].side,
          profit: history[0].profit
        });
      }
      
      result = {
        success: true,
        history: history,
        message: 'Histórico obtido com sucesso via Puppeteer'
      };
    } else if (responseData && responseData.error) {
      result = {
        success: false,
        message: responseData.message || 'Erro ao buscar histórico',
        error: responseData
      };
    } else {
      result = {
        success: false,
        message: 'Não foi possível obter histórico via Puppeteer',
        error: 'Resposta inválida'
      };
    }
    
    // Fechar navegador
    if (browser) {
      try {
        if (page) {
          await page.close().catch(() => {});
        }
        await browser.close();
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao fechar navegador:', e.message);
      }
      browser = null;
      page = null;
    }
    
    return result;

  } catch (error) {
    console.error('[Myfxbook Puppeteer] Erro ao buscar histórico:', error.message);
    return {
      success: false,
      message: 'Erro ao buscar histórico com Puppeteer: ' + error.message,
      error: error.message
    };
  } finally {
    if (browser) {
      try {
        if (page) {
          await page.close().catch(() => {});
        }
        await browser.close();
      } catch (e) {
        console.warn('[Myfxbook Puppeteer] Erro ao fechar navegador:', e.message);
      }
    }
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


