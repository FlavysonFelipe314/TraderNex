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
    // Validações iniciais
    if (!email || !password) {
      console.error(`[Myfxbook] Email ou senha não fornecidos:`, {
        hasEmail: !!email,
        hasPassword: !!password
      });
      return {
        success: false,
        message: 'Email e senha são obrigatórios',
        error: 'Missing credentials'
      };
    }

    // Delay inicial opcional para evitar rate limiting
    if (initialDelay > 0) {
      console.log(`[Myfxbook] Aguardando ${initialDelay}ms antes da primeira tentativa...`);
      await new Promise(resolve => setTimeout(resolve, initialDelay));
    }

    console.log(`[Myfxbook] Tentando fazer login para: ${email}`);
    console.log(`[Myfxbook] Senha (tamanho): ${password ? password.length : 0} caracteres`);
    
    // Construir URL e parâmetros
    const emailParam = encodeURIComponent(email);
    const passwordParam = encodeURIComponent(password);
    const url = `${MYFXBOOK_API_BASE}/login.json`;
    
    // Headers mais completos para parecer com um navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.myfxbook.com/',
      'Origin': 'https://www.myfxbook.com',
      'Connection': 'keep-alive'
    };

    // Tentar fazer login com retry para erro 403
    // Tentar primeiro com GET (método padrão da API)
    // Se falhar com 403, tentar com POST
    let response = null;
    let lastError = null;
    const maxRetries = 3;
    const retryDelay = 3000; // 3 segundos entre tentativas (aumentado)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = retryDelay * attempt;
          console.log(`[Myfxbook] Tentativa ${attempt}/${maxRetries} após ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay)); // Backoff exponencial
        }

        // Primeira tentativa: GET (método padrão)
        // Se falhar com 403, tentar POST na próxima tentativa
        const usePost = attempt > 1 && lastError?.status === 403;
        
        if (usePost) {
          console.log(`[Myfxbook] Tentando com método POST na tentativa ${attempt}...`);
          response = await axios.post(url, null, {
            params: {
              email: email,
              password: password
            },
            timeout: 15000,
            headers: headers,
            validateStatus: function (status) {
              return status < 500;
            }
          });
        } else {
          // Método GET padrão
          const getUrl = `${url}?email=${emailParam}&password=${passwordParam}`;
          console.log(`[Myfxbook] Tentativa ${attempt} - URL (primeiros 150 chars): ${getUrl.substring(0, 150)}...`);
          
          response = await axios.get(getUrl, {
            timeout: 15000,
            headers: headers,
            validateStatus: function (status) {
              return status < 500;
            }
          });
        }
        
        console.log(`[Myfxbook] Resposta recebida - Status: ${response.status}`, {
          'cf-ray': response.headers['cf-ray'],
          'server': response.headers['server'],
          'content-type': response.headers['content-type'],
          'cf-cache-status': response.headers['cf-cache-status'],
          'response-data-preview': response.data ? JSON.stringify(response.data).substring(0, 200) : 'no data'
        });

        // Se for 403, verificar se é Cloudflare bloqueando
        if (response.status === 403) {
          const isCloudflare = response.headers['server'] === 'cloudflare' || response.headers['cf-ray'];
          console.error(`[Myfxbook] Erro 403 detectado. Cloudflare: ${isCloudflare}`, {
            headers: Object.keys(response.headers),
            data: response.data
          });
          
          // Se não for a última tentativa, continuar
          if (attempt < maxRetries) {
            console.warn(`[Myfxbook] Erro 403 na tentativa ${attempt}, tentando novamente com método alternativo...`);
            lastError = {
              status: response.status,
              statusText: response.statusText,
              data: response.data,
              isCloudflare: isCloudflare
            };
            continue;
          }
        } else {
          // Se não for 403, sair do loop
          break;
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.warn(`[Myfxbook] Erro na tentativa ${attempt}, tentando novamente...`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        // Se for a última tentativa e ainda houver erro, usar o erro
        if (error.response) {
          response = error.response;
        } else {
          throw error;
        }
      }
    }

    // Se não houver resposta após todas as tentativas, retornar erro
    if (!response) {
      console.error('[Myfxbook] Nenhuma resposta recebida após todas as tentativas');
      return {
        success: false,
        message: 'Erro ao conectar com a API do MyFXBook. Tente novamente em alguns minutos.',
        error: lastError
      };
    }

    // Verificar se a resposta é um desafio do Cloudflare
    const responseDataType = typeof response.data;
    const responseDataString = responseDataType === 'string' ? response.data : String(response.data || '');
    const isCloudflareChallenge = response.data && 
      (responseDataString.includes('Just a moment') || 
       responseDataString.includes('Enable JavaScript') ||
       responseDataString.includes('cf-challenge') ||
       responseDataString.includes('challenge-platform'));

    console.log('[Myfxbook] Verificando desafio Cloudflare:', {
      status: response.status,
      dataType: responseDataType,
      isCloudflareChallenge: isCloudflareChallenge,
      hasJustAMoment: responseDataString.includes('Just a moment'),
      dataPreview: responseDataString.substring(0, 100)
    });

    // Se for desafio do Cloudflare, tentar com Puppeteer
    if (isCloudflareChallenge && response.status === 403) {
      console.log('[Myfxbook] Desafio do Cloudflare detectado. Tentando com Puppeteer...');
      const puppeteerResult = await loginMyfxbookWithPuppeteer(email, password);
      if (puppeteerResult.success) {
        console.log('[Myfxbook] Puppeteer conseguiu fazer login com sucesso!');
        return puppeteerResult;
      }
      // Se Puppeteer também falhar, continuar com o erro original
      console.warn('[Myfxbook] Puppeteer falhou:', puppeteerResult.message);
    } else if (response.status === 403) {
      console.warn('[Myfxbook] Erro 403 mas não foi detectado como desafio Cloudflare');
    }

    // Verificar status HTTP de erro
    if (response.status >= 400 && response.status < 500) {
      console.error(`[Myfxbook] Status HTTP de erro: ${response.status} ${response.statusText}`, {
        data: response.data,
        headers: response.headers
      });
      
      // Mensagens específicas para diferentes códigos de erro
      let errorMessage = `Erro HTTP ${response.status}: ${response.statusText || 'Erro de requisição'}`;
      
      if (response.status === 403) {
        const isCloudflare = response.headers?.['server'] === 'cloudflare' || response.headers?.['cf-ray'];
        if (isCloudflare || isCloudflareChallenge) {
          errorMessage = 'Acesso negado pelo Cloudflare (403 Forbidden). O MyFXBook está usando proteção Cloudflare que bloqueia requisições automatizadas. O sistema tentou usar Puppeteer mas falhou. Possíveis soluções: 1) Instalar Puppeteer: npm install puppeteer, 2) Aguardar alguns minutos e tentar novamente, 3) Contatar o suporte do MyFXBook sobre acesso via API.';
        } else {
          errorMessage = 'Acesso negado pela API do MyFXBook (403 Forbidden). Isso pode ocorrer por: rate limiting, IP bloqueado, ou credenciais inválidas. Tente novamente em alguns minutos.';
        }
      } else if (response.status === 401) {
        errorMessage = 'Credenciais inválidas ou expiradas. Verifique email e senha.';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: response.data,
        status: response.status
      };
    }

    console.log(`[Myfxbook] Resposta recebida:`, {
      status: response.status,
      statusText: response.statusText,
      hasError: response.data?.error,
      hasSession: !!response.data?.session,
      message: response.data?.message,
      dataKeys: response.data ? Object.keys(response.data) : [],
      fullResponse: JSON.stringify(response.data).substring(0, 500) // Limitar tamanho do log
    });

    // Verificar se a resposta é válida
    if (!response.data || typeof response.data !== 'object') {
      console.error(`[Myfxbook] Resposta inválida ou não é um objeto:`, {
        type: typeof response.data,
        data: response.data
      });
      return {
        success: false,
        message: 'Resposta inválida do Myfxbook: formato de resposta não reconhecido',
        error: response.data
      };
    }

    // Verificar se há erro na resposta
    if (response.data.error) {
      console.error(`[Myfxbook] Erro na resposta:`, response.data);
      const errorMessage = response.data.message || 'Erro ao fazer login no Myfxbook';
      return {
        success: false,
        message: errorMessage,
        error: response.data
      };
    }

    // Verificar se há session na resposta
    if (!response.data.session) {
      console.error(`[Myfxbook] Resposta sem session:`, {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data),
        data: JSON.stringify(response.data).substring(0, 500)
      });
      
      // Verificar se há mensagem de erro não capturada
      if (response.data.message && !response.data.error) {
        return {
          success: false,
          message: `Erro do Myfxbook: ${response.data.message}`,
          error: response.data
        };
      }
      
      return {
        success: false,
        message: 'Resposta inválida do Myfxbook: session não encontrada. Verifique se as credenciais estão corretas.',
        error: response.data
      };
    }

    console.log(`[Myfxbook] Login bem-sucedido! Session: ${response.data.session.substring(0, 20)}...`);
    console.log(`[Myfxbook] Session completa (length): ${response.data.session.length}`);
    return {
      success: true,
      session: response.data.session,
      message: 'Login realizado com sucesso'
    };
  } catch (error) {
    console.error('[Myfxbook] Erro ao fazer login:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null,
      stack: error.stack
    });
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Erro de conexão com Myfxbook',
      error: error.message
    };
  }
}

/**
 * Faz login usando Puppeteer para contornar desafio do Cloudflare
 * @param {string} email - Email do usuário Myfxbook
 * @param {string} password - Senha do usuário Myfxbook
 * @returns {Promise<Object>} Objeto com session ID ou erro
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
    // Tentar diferentes caminhos possíveis do Chromium no Alpine
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
    
    if (!executablePath) {
      console.warn('[Myfxbook Puppeteer] Chromium não encontrado, tentando sem executablePath...');
    }
    
    browser = await puppeteerLib.launch({
      headless: true,
      executablePath: executablePath, // Usa Chromium do sistema se disponível
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process' // Necessário para alguns ambientes Docker
      ]
    });

    const page = await browser.newPage();
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Construir URL de login
    const emailParam = encodeURIComponent(email);
    const passwordParam = encodeURIComponent(password);
    const loginUrl = `${MYFXBOOK_API_BASE}/login.json?email=${emailParam}&password=${passwordParam}`;
    
    console.log('[Myfxbook Puppeteer] Acessando URL de login...');
    
    // Navegar para a URL e aguardar o desafio do Cloudflare ser resolvido
    await page.goto(loginUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Aguardar um pouco para garantir que o JavaScript do Cloudflare foi executado
    await page.waitForTimeout(5000);

    // Tentar obter a resposta JSON
    const content = await page.content();
    
    // Verificar se ainda está no desafio
    if (content.includes('Just a moment') || content.includes('Enable JavaScript')) {
      console.warn('[Myfxbook Puppeteer] Ainda no desafio do Cloudflare após 5 segundos');
      // Aguardar mais um pouco
      await page.waitForTimeout(10000);
    }

    // Tentar obter a resposta via avaliação de JavaScript
    const responseText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Tentar fazer uma requisição fetch para obter o JSON
    const jsonResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url);
        return await response.text();
      } catch (error) {
        return null;
      }
    }, loginUrl);

    if (jsonResponse) {
      try {
        const data = JSON.parse(jsonResponse);
        if (data.session) {
          console.log('[Myfxbook Puppeteer] Login bem-sucedido!');
          return {
            success: true,
            session: data.session,
            message: 'Login realizado com sucesso via Puppeteer'
          };
        }
        if (data.error) {
          return {
            success: false,
            message: data.message || 'Erro ao fazer login no Myfxbook',
            error: data
          };
        }
      } catch (parseError) {
        console.warn('[Myfxbook Puppeteer] Erro ao parsear JSON:', parseError);
      }
    }

    // Se não conseguiu obter JSON, verificar se há erro na página
    if (responseText.includes('error') || responseText.includes('Invalid')) {
      return {
        success: false,
        message: 'Credenciais inválidas ou erro no login',
        error: responseText
      };
    }

    return {
      success: false,
      message: 'Não foi possível obter resposta do login via Puppeteer',
      error: 'Timeout ou desafio não resolvido'
    };

  } catch (error) {
    console.error('[Myfxbook Puppeteer] Erro:', error);
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

