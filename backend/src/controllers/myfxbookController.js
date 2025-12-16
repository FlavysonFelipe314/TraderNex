const pool = require('../config/database');
const myfxbookService = require('../services/myfxbookService');

/**
 * Conectar conta Myfxbook
 * POST /api/myfxbook/connect
 */
exports.connectMyfxbook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, password } = req.body;

    console.log(`[Myfxbook Controller] Conectando conta para userId: ${userId}, email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios.'
      });
    }

    // Fazer login no Myfxbook
    console.log('[Myfxbook Controller] Chamando loginMyfxbook...');
    const loginResult = await myfxbookService.loginMyfxbook(email, password);
    console.log('[Myfxbook Controller] Resultado do login:', { success: loginResult.success, hasSession: !!loginResult.session });

    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: loginResult.message || 'Credenciais inválidas do Myfxbook'
      });
    }

    // Buscar contas do Myfxbook
    // Aumentar delay para garantir que a sessão está totalmente ativada
    console.log('[Myfxbook Controller] Aguardando 1 segundo antes de buscar contas...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('[Myfxbook Controller] Buscando contas com session:', loginResult.session ? loginResult.session.substring(0, 20) + '...' : 'null');
    
    // Tentar buscar contas - se falhar, tentar novamente
    let accountsResult = await myfxbookService.getMyAccounts(loginResult.session);
    
    // Se falhar na primeira tentativa, aguardar mais e tentar novamente
    if (!accountsResult.success && accountsResult.message && accountsResult.message.includes('Invalid session')) {
      console.log('[Myfxbook Controller] Primeira tentativa falhou, aguardando mais 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      accountsResult = await myfxbookService.getMyAccounts(loginResult.session);
    }
    console.log('[Myfxbook Controller] Resultado getMyAccounts:', { 
      success: accountsResult.success, 
      accountsCount: accountsResult.accounts ? accountsResult.accounts.length : 0,
      message: accountsResult.message 
    });

    // Se falhar ao buscar contas, ainda salvar a conexão mas retornar aviso
    if (!accountsResult.success) {
      console.warn('[Myfxbook Controller] Falha ao buscar contas, mas salvando conexão:', accountsResult.message);
      // Continuar mesmo assim para salvar a sessão
    }

    // Verificar se já existe conexão para este usuário
    // Primeiro, garantir que a tabela existe
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS myfxbook_connections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          session_id VARCHAR(255),
          connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Criar índice se não existir
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_myfxbook_connections_user_id 
        ON myfxbook_connections(user_id);
      `);
    } catch (tableError) {
      // Se der erro ao criar tabela, pode ser que já exista ou problema de permissão
      console.warn('Aviso ao criar tabela myfxbook_connections:', tableError.message);
    }

    // Sempre salvar a sessão, mesmo se não conseguir buscar contas agora
    const existingConnection = await pool.query(
      'SELECT * FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (existingConnection.rows.length > 0) {
      // Atualizar conexão existente
      await pool.query(
        `UPDATE myfxbook_connections 
         SET email = $1, session_id = $2, connected_at = NOW(), updated_at = NOW()
         WHERE user_id = $3`,
        [email, loginResult.session, userId]
      );
    } else {
      // Criar nova conexão
      await pool.query(
        `INSERT INTO myfxbook_connections (user_id, email, session_id, connected_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, email, loginResult.session]
      );
    }

    // Se conseguiu buscar contas, retornar sucesso completo
    // Se não, retornar sucesso parcial (sessão salva, mas contas não disponíveis agora)
    if (accountsResult.success) {
      res.json({
        success: true,
        message: 'Conta Myfxbook conectada com sucesso!',
        data: {
          session: loginResult.session,
          accounts: accountsResult.accounts || [],
          accountsCount: accountsResult.accounts ? accountsResult.accounts.length : 0
        }
      });
    } else {
      // Sessão salva, mas contas não disponíveis (pode ser problema de timing/IP)
      // O usuário pode tentar buscar contas depois usando o endpoint de status
      res.json({
        success: true,
        message: 'Conta Myfxbook conectada com sucesso! A sessão foi salva. Os dados das contas serão carregados em breve.',
        data: {
          session: loginResult.session,
          accounts: [],
          accountsCount: 0,
          warning: 'Não foi possível buscar contas imediatamente. Tente atualizar a página em alguns segundos.'
        }
      });
    }
  } catch (error) {
    console.error('Erro ao conectar Myfxbook:', error);
    console.error('Stack trace:', error.stack);
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao conectar conta Myfxbook.';
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      errorMessage = 'Tabela myfxbook_connections não existe. Execute a migração: npm run migrate';
    } else if (error.message) {
      errorMessage = `Erro: ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Desconectar conta Myfxbook
 * POST /api/myfxbook/disconnect
 */
exports.disconnectMyfxbook = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar conexão existente
    const connectionResult = await pool.query(
      'SELECT session_id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma conexão Myfxbook encontrada.'
      });
    }

    const sessionId = connectionResult.rows[0].session_id;

    // Fazer logout no Myfxbook
    if (sessionId) {
      await myfxbookService.logoutMyfxbook(sessionId);
    }

    // Remover conexão do banco
    await pool.query(
      'DELETE FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Conta Myfxbook desconectada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao desconectar Myfxbook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar conta Myfxbook.',
      error: error.message
    });
  }
};

/**
 * Obter status da conexão Myfxbook
 * GET /api/myfxbook/status
 */
exports.getMyfxbookStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se a tabela existe, se não, retornar não conectado
    try {
      const result = await pool.query(
        `SELECT id, email, session_id, connected_at, updated_at,
                CASE 
                  WHEN session_id IS NOT NULL AND connected_at > NOW() - INTERVAL '30 days' 
                  THEN true 
                  ELSE false 
                END as is_active
         FROM myfxbook_connections WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            connected: false,
            message: 'Nenhuma conexão Myfxbook encontrada'
          }
        });
      }

      const connection = result.rows[0];

      // Verificar se a sessão ainda é válida tentando buscar contas
      let accounts = [];
      let sessionValid = false;

      if (connection.session_id && connection.is_active) {
        console.log('[Myfxbook Status] Tentando buscar contas com sessão salva...');
        console.log('[Myfxbook Status] Session ID (primeiros 30 chars):', connection.session_id.substring(0, 30));
        console.log('[Myfxbook Status] Session ID (comprimento):', connection.session_id.length);
        
        // Decodificar a sessão se estiver URL-encoded
        let sessionToUse = connection.session_id;
        try {
          // Tentar decodificar se necessário (algumas sessões podem estar duplamente encoded)
          const decoded = decodeURIComponent(sessionToUse);
          if (decoded !== sessionToUse) {
            console.log('[Myfxbook Status] Session foi decodificada');
            sessionToUse = decoded;
          }
        } catch (e) {
          // Se falhar ao decodificar, usar original
          console.log('[Myfxbook Status] Session não precisa decodificação');
        }
        
        const accountsResult = await myfxbookService.getMyAccounts(sessionToUse);
        if (accountsResult.success) {
          accounts = accountsResult.accounts;
          sessionValid = true;
          console.log(`[Myfxbook Status] Contas obtidas: ${accounts.length}`);
        } else {
          // Se retornar "Invalid session", a sessão pode ter expirado ou estar inválida
          if (accountsResult.message && accountsResult.message.includes('Invalid session')) {
            console.warn('[Myfxbook Status] Sessão inválida detectada. Será necessário fazer novo login.');
            // Marcar como desconectado - usuário precisará reconectar
            sessionValid = false;
          } else {
            // Outro tipo de erro
            console.warn('[Myfxbook Status] Não foi possível buscar contas:', accountsResult.message);
            // Se a sessão foi criada recentemente (últimos 5 minutos), considerar válida mesmo sem contas
            const sessionAge = Date.now() - new Date(connection.connected_at).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            sessionValid = sessionAge < fiveMinutes;
          }
        }
      }

      res.json({
        success: true,
        data: {
          connected: sessionValid,
          email: connection.email,
          connectedAt: connection.connected_at,
          accountsCount: accounts.length,
          accounts: accounts,
          hasSession: !!connection.session_id,
          sessionValid: sessionValid
        }
      });
    } catch (tableError) {
      // Se a tabela não existir, retornar não conectado
      if (tableError.message && tableError.message.includes('does not exist')) {
        return res.json({
          success: true,
          data: {
            connected: false,
            message: 'Nenhuma conexão Myfxbook encontrada'
          }
        });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Erro ao buscar status Myfxbook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status da conexão Myfxbook.',
      error: error.message
    });
  }
};

/**
 * Obter contas do Myfxbook
 * GET /api/myfxbook/accounts
 */
exports.getMyfxbookAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const connectionResult = await pool.query(
      'SELECT session_id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionResult.rows.length === 0 || !connectionResult.rows[0].session_id) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma conexão Myfxbook encontrada. Conecte sua conta primeiro.'
      });
    }

    let sessionId = connectionResult.rows[0].session_id;
    
    // Decodificar a sessão se estiver URL-encoded
    try {
      const decoded = decodeURIComponent(sessionId);
      if (decoded !== sessionId) {
        console.log('[Myfxbook Accounts] Session foi decodificada');
        sessionId = decoded;
      }
    } catch (e) {
      // Se falhar ao decodificar, usar original
      console.log('[Myfxbook Accounts] Session não precisa decodificação');
    }
    
    const accountsResult = await myfxbookService.getMyAccounts(sessionId);

    if (!accountsResult.success) {
      return res.status(500).json({
        success: false,
        message: accountsResult.message || 'Erro ao buscar contas do Myfxbook'
      });
    }

    res.json({
      success: true,
      data: {
        accounts: accountsResult.accounts,
        count: accountsResult.accounts.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar contas Myfxbook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas do Myfxbook.',
      error: error.message
    });
  }
};

/**
 * Obter dados de uma conta específica
 * GET /api/myfxbook/accounts/:accountId/data
 */
exports.getAccountData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const connectionResult = await pool.query(
      'SELECT session_id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionResult.rows.length === 0 || !connectionResult.rows[0].session_id) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma conexão Myfxbook encontrada.'
      });
    }

    let sessionId = connectionResult.rows[0].session_id;
    
    // Decodificar a sessão se estiver URL-encoded
    try {
      const decoded = decodeURIComponent(sessionId);
      if (decoded !== sessionId) {
        console.log('[Myfxbook Account Data] Session foi decodificada');
        sessionId = decoded;
      }
    } catch (e) {
      // Se falhar ao decodificar, usar original
      console.log('[Myfxbook Account Data] Session não precisa decodificação');
    }

    // Buscar múltiplos dados em paralelo
    const [openTrades, history, dailyGain, dataDaily] = await Promise.all([
      myfxbookService.getOpenTrades(sessionId, accountId),
      myfxbookService.getHistory(sessionId, accountId),
      startDate && endDate 
        ? myfxbookService.getDailyGain(sessionId, accountId, startDate, endDate)
        : Promise.resolve({ success: true, dailyGain: [] }),
      startDate && endDate
        ? myfxbookService.getDataDaily(sessionId, accountId, startDate, endDate)
        : Promise.resolve({ success: true, dataDaily: [] })
    ]);

    res.json({
      success: true,
      data: {
        accountId,
        openTrades: openTrades.success ? openTrades.trades : [],
        history: history.success ? history.history : [],
        dailyGain: dailyGain.success ? dailyGain.dailyGain : [],
        dataDaily: dataDaily.success ? dataDaily.dataDaily : []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados da conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados da conta.',
      error: error.message
    });
  }
};

