const pool = require('../config/database');

/**
 * Obter todos os usuários com informações agregadas
 * GET /api/admin/users
 * Retorna TODOS os usuários com suas informações de MT4 e MyFXBook agregadas
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Buscar todos os usuários não-admin com plano selecionado
    const usersResult = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.created_at,
        u.is_active,
        u.email_verified,
        cp.selected_plan_id,
        cp.plan_status,
        ip.name as plan_name
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
      WHERE u.is_admin = FALSE
      ORDER BY u.created_at DESC`
    );

    const users = usersResult.rows;

    // Para cada usuário, buscar suas contas MT4 e conexão MyFXBook
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        // Buscar contas MT4 (incluindo senha descriptografada para admin)
        const mt4Result = await pool.query(
          `SELECT 
            id,
            account_number,
            account_name,
            broker,
            server,
            balance,
            equity,
            currency,
            status,
            connected_at,
            last_sync,
            myfxbook_integration_login,
            automation_enabled,
            risk_profile,
            encrypted_password,
            credentials_status,
            credentials_reviewed_at,
            credentials_review_notes,
            created_at
          FROM mt4_accounts 
          WHERE user_id = $1
          ORDER BY created_at DESC`,
          [user.id]
        );
        
        // Descriptografar senhas para o admin
        const { decrypt } = require('../utils/encryption');
        const mt4AccountsWithPassword = mt4Result.rows.map(account => {
          let password = null;
          if (account.encrypted_password) {
            try {
              password = decrypt(account.encrypted_password);
            } catch (error) {
              console.error(`Erro ao descriptografar senha da conta ${account.id}:`, error);
            }
          }
          return {
            ...account,
            password: password // Senha descriptografada apenas para admin
          };
        });

        // Buscar conexão MyFXBook
        const myfxbookResult = await pool.query(
          `SELECT 
            id,
            email,
            connected_at,
            updated_at
          FROM myfxbook_connections 
          WHERE user_id = $1
          LIMIT 1`,
          [user.id]
        );

        return {
          ...user,
          mt4_accounts: mt4AccountsWithPassword,
          myfxbook: myfxbookResult.rows[0] || null,
          has_mt4: mt4Result.rows.length > 0,
          has_myfxbook: myfxbookResult.rows.length > 0,
          mt4_count: mt4Result.rows.length,
          selected_plan_id: user.selected_plan_id,
          plan_name: user.plan_name,
          plan_status: user.plan_status
        };
      })
    );

    res.json({
      success: true,
      data: usersWithDetails
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários.',
      error: error.message
    });
  }
};

/**
 * Obter todas as contas MT4 de todos os usuários
 * GET /api/admin/mt4-accounts
 * Retorna TODOS os usuários, mesmo sem conta MT4 ou MyFXBook
 */
exports.getAllMT4Accounts = async (req, res) => {
  try {
    // Buscar todos os usuários com suas contas MT4 e conexões MyFXBook
    const result = await pool.query(
      `SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at as user_created_at,
        u.is_admin,
        -- Dados da conta MT4 (pode ser NULL se não tiver)
        ma.id as mt4_account_id,
        ma.account_number,
        ma.account_name,
        ma.broker,
        ma.server,
        ma.balance,
        ma.equity,
        ma.currency,
        ma.status,
        ma.connected_at,
        ma.last_sync,
        ma.myfxbook_integration_login,
        ma.automation_enabled,
        ma.risk_profile,
        ma.created_at as mt4_created_at,
        -- Dados da conexão MyFXBook (pode ser NULL se não tiver)
        mc.id as myfxbook_connection_id,
        mc.email as myfxbook_email,
        mc.connected_at as myfxbook_connected_at,
        mc.updated_at as myfxbook_updated_at
      FROM users u
      LEFT JOIN mt4_accounts ma ON u.id = ma.user_id
      LEFT JOIN myfxbook_connections mc ON u.id = mc.user_id
      WHERE u.is_admin = FALSE
      ORDER BY u.created_at DESC, ma.created_at DESC`
    );

    // Agrupar resultados por usuário (um usuário pode ter múltiplas contas MT4)
    const usersMap = new Map();
    
    result.rows.forEach(row => {
      const userId = row.user_id;
      
      if (!usersMap.has(userId)) {
        // Primeira vez vendo este usuário - criar entrada
        usersMap.set(userId, {
          user_id: userId,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          user_created_at: row.user_created_at,
          is_admin: row.is_admin,
          // Dados MyFXBook (mesmo se tiver múltiplas contas MT4, MyFXBook é por usuário)
          myfxbook_connection_id: row.myfxbook_connection_id,
          myfxbook_email: row.myfxbook_email,
          myfxbook_connected_at: row.myfxbook_connected_at,
          myfxbook_updated_at: row.myfxbook_updated_at,
          // Contas MT4 (array para suportar múltiplas contas)
          mt4_accounts: []
        });
      }
      
      const userData = usersMap.get(userId);
      
      // Adicionar conta MT4 se existir e ainda não foi adicionada
      if (row.mt4_account_id) {
        const accountExists = userData.mt4_accounts.some(acc => acc.id === row.mt4_account_id);
        if (!accountExists) {
          userData.mt4_accounts.push({
            id: row.mt4_account_id,
            account_number: row.account_number,
            account_name: row.account_name,
            broker: row.broker,
            server: row.server,
            balance: row.balance,
            equity: row.equity,
            currency: row.currency,
            status: row.status,
            connected_at: row.connected_at,
            last_sync: row.last_sync,
            myfxbook_integration_login: row.myfxbook_integration_login,
            automation_enabled: row.automation_enabled,
            risk_profile: row.risk_profile,
            created_at: row.mt4_created_at
          });
        }
      }
    });
    
    console.log(`[Admin] Total de linhas retornadas pela query: ${result.rows.length}`);
    
    // Converter para array e expandir contas MT4 (uma linha por conta MT4, ou uma linha se não tiver conta)
    const finalData = [];
    usersMap.forEach((userData, userId) => {
      if (userData.mt4_accounts.length > 0) {
        // Se tem contas MT4, criar uma linha para cada conta
        userData.mt4_accounts.forEach(account => {
          finalData.push({
            id: account.id,
            user_id: userId,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            user_created_at: userData.user_created_at,
            is_admin: userData.is_admin,
            account_number: account.account_number,
            account_name: account.account_name,
            broker: account.broker,
            server: account.server,
            balance: account.balance,
            equity: account.equity,
            currency: account.currency,
            status: account.status,
            connected_at: account.connected_at,
            last_sync: account.last_sync,
            myfxbook_integration_login: account.myfxbook_integration_login,
            automation_enabled: account.automation_enabled,
            risk_profile: account.risk_profile,
            created_at: account.created_at,
            // Dados MyFXBook (do usuário, não da conta)
            myfxbook_connection_id: userData.myfxbook_connection_id,
            myfxbook_email: userData.myfxbook_email,
            myfxbook_connected_at: userData.myfxbook_connected_at,
            myfxbook_updated_at: userData.myfxbook_updated_at
          });
        });
      } else {
        // Se não tem conta MT4, criar uma linha mesmo assim (para mostrar o usuário)
        finalData.push({
          id: null,
          user_id: userId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_created_at: userData.user_created_at,
          is_admin: userData.is_admin,
          account_number: null,
          account_name: null,
          broker: null,
          server: null,
          balance: null,
          equity: null,
          currency: null,
          status: null,
          connected_at: null,
          last_sync: null,
          myfxbook_integration_login: null,
          automation_enabled: null,
          risk_profile: null,
          created_at: null,
          // Dados MyFXBook (mesmo sem conta MT4, pode ter MyFXBook)
          myfxbook_connection_id: userData.myfxbook_connection_id,
          myfxbook_email: userData.myfxbook_email,
          myfxbook_connected_at: userData.myfxbook_connected_at,
          myfxbook_updated_at: userData.myfxbook_updated_at
        });
      }
    });

    console.log(`[Admin] Total de registros finais após processamento: ${finalData.length}`);
    console.log(`[Admin] Usuários únicos: ${usersMap.size}`);
    
    res.json({
      success: true,
      data: finalData,
      meta: {
        total_users: usersMap.size,
        total_records: finalData.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar contas MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas MT4.',
      error: error.message
    });
  }
};

/**
 * Atualizar login de integração MyFXBook de uma conta MT4
 * PUT /api/admin/mt4-accounts/:accountId/myfxbook-login
 */
exports.updateMyfxbookIntegrationLogin = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { myfxbook_integration_login } = req.body;
    const adminId = req.user.userId;

    // Verificar se a conta existe
    const accountResult = await pool.query(
      `SELECT id, user_id, credentials_status 
       FROM mt4_accounts 
       WHERE id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    const account = accountResult.rows[0];

    // Atualizar o login de integração
    const updateResult = await pool.query(
      `UPDATE mt4_accounts 
       SET myfxbook_integration_login = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [myfxbook_integration_login || null, accountId]
    );

    res.json({
      success: true,
      message: 'Login de integração MyFXBook atualizado com sucesso!',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar login de integração MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar login de integração MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Aprovar credenciais MT4 de um usuário (Admin)
 * POST /api/admin/mt4-accounts/:accountId/approve-credentials
 */
exports.approveMT4Credentials = async (req, res) => {
  try {
    const { accountId } = req.params;
    const adminId = req.user.userId;

    // Verificar se a conta existe e buscar dados do usuário
    const accountResult = await pool.query(
      `SELECT ma.id, ma.user_id, ma.account_number, ma.credentials_status,
              u.email, u.first_name, u.last_name
       FROM mt4_accounts ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    const account = accountResult.rows[0];

    if (account.credentials_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Credenciais já foram ${account.credentials_status === 'approved' ? 'aprovadas' : 'rejeitadas'}.`
      });
    }

    // Aprovar credenciais e ativar conta
    await pool.query(
      `UPDATE mt4_accounts
       SET credentials_status = 'approved',
           credentials_reviewed_at = NOW(),
           credentials_reviewed_by = $1,
           status = 'active',
           updated_at = NOW()
       WHERE id = $2`,
      [adminId, accountId]
    );

    // Enviar email de aprovação
    const { sendMT4CredentialsApprovalEmail } = require('../services/emailService');
    try {
      await sendMT4CredentialsApprovalEmail(
        account.email,
        account.first_name || 'Cliente',
        account.account_number
      );
    } catch (emailError) {
      console.error('Erro ao enviar email de aprovação de credenciais:', emailError);
      // Não falhar a requisição se o email falhar
    }

    res.json({
      success: true,
      message: 'Credenciais MT4 aprovadas com sucesso! O usuário receberá um email de confirmação.'
    });
  } catch (error) {
    console.error('Erro ao aprovar credenciais MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar credenciais MT4.',
      error: error.message
    });
  }
};

/**
 * Rejeitar credenciais MT4 de um usuário (Admin)
 * POST /api/admin/mt4-accounts/:accountId/reject-credentials
 */
exports.rejectMT4Credentials = async (req, res) => {
  try {
    const { accountId } = req.params;
    const adminId = req.user.userId;
    const { notes } = req.body || {};

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Justificativa é obrigatória para rejeitar credenciais.'
      });
    }

    // Verificar se a conta existe e buscar dados do usuário
    const accountResult = await pool.query(
      `SELECT ma.id, ma.user_id, ma.account_number, ma.credentials_status,
              u.email, u.first_name, u.last_name
       FROM mt4_accounts ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    const account = accountResult.rows[0];

    if (account.credentials_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Credenciais já foram ${account.credentials_status === 'approved' ? 'aprovadas' : 'rejeitadas'}.`
      });
    }

    // Rejeitar credenciais
    await pool.query(
      `UPDATE mt4_accounts
       SET credentials_status = 'rejected',
           credentials_reviewed_at = NOW(),
           credentials_reviewed_by = $1,
           credentials_review_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [adminId, notes, accountId]
    );

    // Enviar email de rejeição
    const { sendMT4CredentialsRejectionEmail } = require('../services/emailService');
    try {
      await sendMT4CredentialsRejectionEmail(
        account.email,
        account.first_name || 'Cliente',
        account.account_number,
        notes
      );
    } catch (emailError) {
      console.error('Erro ao enviar email de rejeição de credenciais:', emailError);
      // Não falhar a requisição se o email falhar
    }

    res.json({
      success: true,
      message: 'Credenciais MT4 rejeitadas. O usuário receberá um email com a justificativa.'
    });
  } catch (error) {
    console.error('Erro ao rejeitar credenciais MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar credenciais MT4.',
      error: error.message
    });
  }
};

/**
 * Obter todas as conexões MyFXBook
 * GET /api/admin/myfxbook-connections
 */
exports.getAllMyfxbookConnections = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        mc.id,
        mc.user_id,
        mc.email,
        mc.connected_at,
        mc.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM myfxbook_connections mc
      INNER JOIN users u ON mc.user_id = u.id
      ORDER BY mc.connected_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar conexões MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conexões MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Atualizar senha MyFXBook de um usuário (Admin)
 * PUT /api/admin/myfxbook-connections/:userId/password
 */
exports.updateMyfxbookPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória.'
      });
    }

    // Verificar se o usuário existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Criptografar senha
    const { encrypt } = require('../utils/encryption');
    const encryptedPassword = encrypt(password);

    // Verificar se já existe conexão MyFXBook
    const connectionCheck = await pool.query(
      'SELECT id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionCheck.rows.length > 0) {
      // Atualizar senha na conexão existente
      await pool.query(
        `UPDATE myfxbook_connections 
         SET encrypted_password = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [encryptedPassword, userId]
      );
    } else {
      // Criar conexão com apenas a senha (sem email ainda)
      await pool.query(
        `INSERT INTO myfxbook_connections (user_id, email, encrypted_password, connected_at, updated_at)
         VALUES ($1, '', $2, NOW(), NOW())`,
        [userId, encryptedPassword]
      );
    }

    res.json({
      success: true,
      message: 'Senha MyFXBook atualizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar senha MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Atualizar email MyFXBook de um usuário (Admin)
 * PUT /api/admin/myfxbook-connections/:userId/email
 */
exports.updateMyfxbookEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório.'
      });
    }

    // Verificar se o usuário existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Verificar se já existe conexão MyFXBook
    const connectionCheck = await pool.query(
      'SELECT id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionCheck.rows.length > 0) {
      // Atualizar email na conexão existente
      await pool.query(
        `UPDATE myfxbook_connections 
         SET email = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [email, userId]
      );
    } else {
      // Criar conexão com apenas o email
      await pool.query(
        `INSERT INTO myfxbook_connections (user_id, email, connected_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, email]
      );
    }

    res.json({
      success: true,
      message: 'Email MyFXBook atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar email MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar email MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Configurar credenciais padrão do sistema MyFXBook (Admin)
 * POST /api/admin/system/myfxbook-config
 */
exports.setSystemMyfxbookConfig = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminId = req.user.userId;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios.'
      });
    }

    // Criptografar senha
    const { encrypt } = require('../utils/encryption');
    const encryptedPassword = encrypt(password);

    // Verificar se já existe configuração
    const existingConfig = await pool.query(
      'SELECT id FROM system_myfxbook_config LIMIT 1'
    );

    if (existingConfig.rows.length > 0) {
      // Atualizar configuração existente
      await pool.query(
        `UPDATE system_myfxbook_config 
         SET email = $1, encrypted_password = $2, updated_at = NOW()
         WHERE id = $3`,
        [email, encryptedPassword, existingConfig.rows[0].id]
      );
    } else {
      // Criar nova configuração
      await pool.query(
        `INSERT INTO system_myfxbook_config (email, encrypted_password, created_by)
         VALUES ($1, $2, $3)`,
        [email, encryptedPassword, adminId]
      );
    }

    res.json({
      success: true,
      message: 'Credenciais padrão do sistema MyFXBook configuradas com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao configurar credenciais padrão MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao configurar credenciais padrão MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Obter credenciais padrão do sistema MyFXBook (Admin)
 * GET /api/admin/system/myfxbook-config
 */
exports.getSystemMyfxbookConfig = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at, updated_at FROM system_myfxbook_config LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: 'Credenciais padrão não configuradas'
        }
      });
    }

    res.json({
      success: true,
      data: {
        configured: true,
        email: result.rows[0].email,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao buscar configuração padrão MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configuração padrão MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Testar conexão MyFXBook (Health Check)
 * GET /api/admin/system/myfxbook-health
 */
exports.testMyfxbookHealth = async (req, res) => {
  try {
    const configResult = await pool.query(
      'SELECT email, encrypted_password FROM system_myfxbook_config LIMIT 1'
    );

    if (configResult.rows.length === 0) {
      return res.json({
        success: false,
        connected: false,
        message: 'Credenciais padrão do sistema MyFXBook não configuradas.'
      });
    }

    const { email, encrypted_password } = configResult.rows[0];
    const { decrypt } = require('../utils/encryption');
    let password;
    try {
      password = decrypt(encrypted_password);
    } catch (decryptError) {
      return res.json({
        success: false,
        connected: false,
        message: 'Erro ao descriptografar credenciais: ' + decryptError.message
      });
    }

    const { loginMyfxbook, getMyAccounts } = require('../services/myfxbookService');
    const loginResult = await loginMyfxbook(email, password);

    if (!loginResult.success) {
      return res.json({
        success: false,
        connected: false,
        message: 'Erro ao fazer login no MyFXBook: ' + loginResult.message
      });
    }

    if (!loginResult.session) {
      return res.json({
        success: false,
        connected: false,
        message: 'Login retornou sucesso mas não forneceu session ID'
      });
    }

    const accountsResult = await getMyAccounts(loginResult.session);

    if (!accountsResult.success) {
      return res.json({
        success: false,
        connected: false,
        message: 'Erro ao buscar contas: ' + accountsResult.message
      });
    }
    res.json({
      success: true,
      connected: true,
      message: 'Conexão MyFXBook funcionando corretamente!',
      accountsCount: accountsResult.accounts ? accountsResult.accounts.length : 0,
      accounts: accountsResult.accounts || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Erro ao testar conexão MyFXBook: ' + error.message
    });
  }
};

/**
 * Testar integração MyFXBook de um usuário específico
 * GET /api/admin/users/:userId/myfxbook-test
 */
exports.testUserMyfxbookIntegration = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar conta MT4 do usuário com myfxbook_integration_login configurado
    const mt4Result = await pool.query(
      `SELECT id, account_number, myfxbook_integration_login
       FROM mt4_accounts 
       WHERE user_id = $1 AND myfxbook_integration_login IS NOT NULL AND myfxbook_integration_login != ''
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (mt4Result.rows.length === 0) {
      return res.json({
        success: false,
        connected: false,
        message: 'Nenhuma conta MT4 com Account ID MyFXBook configurado para este usuário.'
      });
    }

    const mt4Account = mt4Result.rows[0];
    const myfxbookAccountId = mt4Account.myfxbook_integration_login;

    // Buscar credenciais padrão do sistema
    const configResult = await pool.query(
      'SELECT email, encrypted_password FROM system_myfxbook_config LIMIT 1'
    );

    if (configResult.rows.length === 0) {
      return res.json({
        success: false,
        connected: false,
        message: 'Credenciais padrão do sistema MyFXBook não configuradas.'
      });
    }

    const { email, encrypted_password } = configResult.rows[0];
    const { decrypt } = require('../utils/encryption');
    const password = decrypt(encrypted_password);

    // Fazer login no MyFXBook
    const { loginMyfxbook, getMyAccounts, getOpenTrades } = require('../services/myfxbookService');
    const loginResult = await loginMyfxbook(email, password);

    if (!loginResult.success) {
      return res.json({
        success: false,
        connected: false,
        message: 'Erro ao fazer login no MyFXBook: ' + loginResult.message
      });
    }

    // Buscar contas e verificar se a conta específica existe
    const accountsResult = await getMyAccounts(loginResult.session);

    if (!accountsResult.success) {
      return res.json({
        success: false,
        connected: false,
        message: 'Erro ao buscar contas: ' + accountsResult.message
      });
    }

    // Encontrar a conta específica
    const accountIdNum = parseInt(myfxbookAccountId);
    const accountIdStr = String(myfxbookAccountId).trim();
    
    const accountData = accountsResult.accounts.find(acc => {
      const accAccountId = acc.accountId;
      if (accAccountId === accountIdNum || 
          accAccountId === accountIdStr || 
          String(accAccountId) === accountIdStr ||
          parseInt(accAccountId) === accountIdNum) {
        return true;
      }
      if (acc.id === accountIdNum || String(acc.id) === accountIdStr) {
        return true;
      }
      return false;
    });

    if (!accountData) {
      return res.json({
        success: false,
        connected: false,
        message: `Conta com Account ID ${myfxbookAccountId} não encontrada no MyFXBook. Verifique se o Account ID está correto.`,
        availableAccounts: accountsResult.accounts.map(acc => ({
          id: acc.id,
          accountId: acc.accountId,
          name: acc.name
        }))
      });
    }

    // Tentar buscar dados da conta para confirmar que está funcionando
    const openTradesResult = await getOpenTrades(loginResult.session, myfxbookAccountId);

    res.json({
      success: true,
      connected: true,
      message: 'Integração MyFXBook funcionando corretamente!',
      account: {
        id: accountData.id,
        accountId: accountData.accountId,
        name: accountData.name,
        gain: accountData.gain,
        profit: accountData.profit,
        drawdown: accountData.drawdown,
        equity: accountData.equity
      },
      canFetchData: openTradesResult.success,
      mt4AccountNumber: mt4Account.account_number
    });
  } catch (error) {
    console.error('Erro ao testar integração MyFXBook do usuário:', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Erro ao testar integração: ' + error.message
    });
  }
};

/**
 * Obter dados MyFXBook de uma conta específica usando accountId
 * GET /api/admin/myfxbook/account/:accountId/data
 */
exports.getMyfxbookAccountDataByAccountId = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID é obrigatório.'
      });
    }

    // Buscar credenciais padrão do sistema
    const configResult = await pool.query(
      'SELECT email, encrypted_password FROM system_myfxbook_config LIMIT 1'
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credenciais padrão do sistema MyFXBook não configuradas. Configure-as no painel admin.'
      });
    }

    const { email, encrypted_password } = configResult.rows[0];
    const { decrypt } = require('../utils/encryption');
    const password = decrypt(encrypted_password);

    // Fazer login no MyFXBook usando credenciais padrão
    const { loginMyfxbook, getMyAccounts } = require('../services/myfxbookService');
    const loginResult = await loginMyfxbook(email, password);

    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Erro ao fazer login no MyFXBook: ' + loginResult.message
      });
    }

    // Buscar dados da conta específica usando o accountId
    const { getOpenTrades, getHistory, getDailyGain, getDataDaily } = require('../services/myfxbookService');
    
    // Buscar múltiplos dados em paralelo
    const [accountsResult, openTrades, history] = await Promise.all([
      getMyAccounts(loginResult.session),
      getOpenTrades(loginResult.session, accountId),
      getHistory(loginResult.session, accountId)
    ]);

    // Encontrar a conta específica nos resultados
    let accountData = null;
    if (accountsResult.success && accountsResult.accounts) {
      accountData = accountsResult.accounts.find(acc => 
        acc.id === parseInt(accountId) || acc.accountId === accountId
      );
    }

    // Calcular datas para ganho diário (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const [dailyGain, dataDaily] = await Promise.all([
      getDailyGain(loginResult.session, accountId, startDateStr, endDateStr),
      getDataDaily(loginResult.session, accountId, startDateStr, endDateStr)
    ]);

    res.json({
      success: true,
      data: {
        accountId,
        account: accountData,
        openTrades: openTrades.success ? openTrades.trades : [],
        history: history.success ? history.history : [],
        dailyGain: dailyGain.success ? dailyGain.dailyGain : [],
        dataDaily: dataDaily.success ? dataDaily.dataDaily : []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados MyFXBook por accountId:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Atualizar controles operacionais de uma conta MT4 (Admin)
 * PUT /api/admin/mt4-accounts/:accountId/operational-controls
 */
exports.updateOperationalControls = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { automation_enabled, risk_profile } = req.body;

    // Verificar se a conta existe
    const accountResult = await pool.query(
      'SELECT id FROM mt4_accounts WHERE id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    // Validar risk_profile
    if (risk_profile && !['conservador', 'moderado', 'agressivo'].includes(risk_profile)) {
      return res.status(400).json({
        success: false,
        message: 'Perfil de risco inválido. Deve ser: conservador, moderado ou agressivo.'
      });
    }

    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (automation_enabled !== undefined) {
      updateFields.push(`automation_enabled = $${paramIndex}`);
      updateValues.push(automation_enabled);
      paramIndex++;
    }

    if (risk_profile !== undefined) {
      updateFields.push(`risk_profile = $${paramIndex}`);
      updateValues.push(risk_profile);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar.'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(accountId);

    // Atualizar
    const updateResult = await pool.query(
      `UPDATE mt4_accounts 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Controles operacionais atualizados com sucesso!',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar controles operacionais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar controles operacionais.',
      error: error.message
    });
  }
};

/**
 * Deletar usuário (Admin)
 * DELETE /api/admin/users/:userId
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se o usuário existe e não é admin
    const userCheck = await pool.query(
      'SELECT id, email, is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    if (userCheck.rows[0].is_admin) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar um usuário administrador.'
      });
    }

    // Deletar usuário (CASCADE vai deletar registros relacionados)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário.',
      error: error.message
    });
  }
};

