const pool = require('../config/database');

// Obter dados do dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar dados do perfil
    const profileResult = await pool.query(
      `SELECT balance, total_invested, total_profit, profit_percentage, account_type
       FROM client_profiles WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado.'
      });
    }

    const profile = profileResult.rows[0];

    // Buscar contas MT4
    const mt4Result = await pool.query(
      `SELECT COUNT(*) as total_accounts,
              COALESCE(SUM(balance), 0) as total_balance,
              COALESCE(SUM(equity), 0) as total_equity
       FROM mt4_accounts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // Buscar transações recentes
    const transactionsResult = await pool.query(
      `SELECT id, type, amount, status, description, created_at
       FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Buscar investimentos ativos
    const investmentsResult = await pool.query(
      `SELECT COUNT(*) as active_investments,
              COALESCE(SUM(amount), 0) as total_invested_amount,
              COALESCE(SUM(current_value), 0) as current_total_value
       FROM user_investments WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        profile: {
          balance: profile.balance != null ? parseFloat(profile.balance) : 0,
          totalInvested: profile.total_invested != null ? parseFloat(profile.total_invested) : 0,
          totalProfit: profile.total_profit != null ? parseFloat(profile.total_profit) : 0,
          profitPercentage: profile.profit_percentage != null ? parseFloat(profile.profit_percentage) : 0,
          accountType: profile.account_type
        },
        mt4Accounts: {
          totalAccounts: parseInt(mt4Result.rows[0].total_accounts),
          totalBalance: parseFloat(mt4Result.rows[0].total_balance),
          totalEquity: parseFloat(mt4Result.rows[0].total_equity)
        },
        recentTransactions: transactionsResult.rows,
        investments: {
          activeInvestments: parseInt(investmentsResult.rows[0].active_investments),
          totalInvestedAmount: parseFloat(investmentsResult.rows[0].total_invested_amount),
          currentTotalValue: parseFloat(investmentsResult.rows[0].current_total_value)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do dashboard.',
      error: error.message
    });
  }
};

// Obter estatísticas de performance
exports.getPerformanceStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period } = req.query; // 7d, 30d, 90d, 1y

    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '90 days'";
        break;
      case '1y':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(
      `SELECT report_date, total_trades, winning_trades, losing_trades,
              win_rate, total_profit, total_loss, net_profit, roi
       FROM performance_reports
       WHERE user_id = $1 AND ${dateFilter}
       ORDER BY report_date ASC`,
      [userId]
    );

    // Converter valores DECIMAL para números
    const normalizedData = result.rows.map(row => ({
      ...row,
      total_trades: row.total_trades != null ? parseInt(row.total_trades) : 0,
      winning_trades: row.winning_trades != null ? parseInt(row.winning_trades) : 0,
      losing_trades: row.losing_trades != null ? parseInt(row.losing_trades) : 0,
      win_rate: row.win_rate != null ? parseFloat(row.win_rate) : 0,
      total_profit: row.total_profit != null ? parseFloat(row.total_profit) : 0,
      total_loss: row.total_loss != null ? parseFloat(row.total_loss) : 0,
      net_profit: row.net_profit != null ? parseFloat(row.net_profit) : 0,
      roi: row.roi != null ? parseFloat(row.roi) : 0,
      // Adicionar campo 'value' para compatibilidade com o gráfico
      value: row.net_profit != null ? parseFloat(row.net_profit) : 0
    }));

    res.json({
      success: true,
      data: normalizedData
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas.',
      error: error.message
    });
  }
};

// Obter contas MT4
exports.getMT4Accounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, account_number, account_name, broker, server, balance,
              equity, currency, status, connected_at, last_sync,
              automation_enabled, risk_profile, myfxbook_integration_login
       FROM mt4_accounts WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
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
 * Obter dados MyFXBook da conta do usuário usando accountId configurado pelo admin
 * GET /api/dashboard/myfxbook-data
 */
exports.getMyfxbookData = async (req, res) => {
  try {
    const userId = req.user.userId;

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
        success: true,
        data: {
          connected: false,
          message: 'Nenhuma conta MT4 com integração MyFXBook configurada.'
        }
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
        success: true,
        data: {
          connected: false,
          message: 'Sistema MyFXBook não configurado. Entre em contato com o administrador.'
        }
      });
    }

    const { email, encrypted_password } = configResult.rows[0];
    const { decrypt } = require('../utils/encryption');
    const password = decrypt(encrypted_password);

    // Fazer login no MyFXBook usando credenciais padrão
    const { loginMyfxbook, getMyAccounts, getOpenTrades, getHistory, getDailyGain, getDataDaily } = require('../services/myfxbookService');
    const loginResult = await loginMyfxbook(email, password);

    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Erro ao conectar ao MyFXBook: ' + loginResult.message
      });
    }

    // Buscar dados da conta específica
    console.log(`[MyFXBook Data] Buscando dados para Account ID: ${myfxbookAccountId}`);
    
    // Primeiro, buscar as contas para encontrar o ID interno
    const accountsResult = await getMyAccounts(loginResult.session);
    
    // Encontrar a conta específica nos resultados
    // O myfxbook_integration_login é o Account Number (accountId) no MyFXBook, não o id interno
    let accountData = null;
    let internalAccountId = null;
    
    if (accountsResult.success && accountsResult.accounts) {
      // Tentar encontrar a conta por accountId (Account Number) - pode ser string ou número
      const accountIdNum = parseInt(myfxbookAccountId);
      const accountIdStr = String(myfxbookAccountId).trim();
      
      accountData = accountsResult.accounts.find(acc => {
        // O accountId é o Account Number (ex: 7739458, 34182616)
        // Comparar como número e como string
        const accAccountId = acc.accountId;
        if (accAccountId === accountIdNum || 
            accAccountId === accountIdStr || 
            String(accAccountId) === accountIdStr ||
            parseInt(accAccountId) === accountIdNum) {
          return true;
        }
        // Também tentar comparar com id interno (caso o admin tenha informado o id ao invés do accountId)
        if (acc.id === accountIdNum || String(acc.id) === accountIdStr) {
          return true;
        }
        return false;
      });
      
      if (accountData) {
        // Usar o ID interno (id) para buscar histórico, trades, etc.
        internalAccountId = accountData.id;
        console.log(`[MyFXBook Data] Conta encontrada! ID interno: ${internalAccountId}, Account Number: ${accountData.accountId}`);
      } else {
        console.warn(`[MyFXBook Data] Conta com accountId ${myfxbookAccountId} não encontrada.`);
      }
    }
    
    // Se não encontrou a conta, ainda tentar usar o accountId fornecido
    if (!internalAccountId) {
      internalAccountId = myfxbookAccountId;
      console.warn(`[MyFXBook Data] Usando accountId fornecido como ID interno: ${internalAccountId}`);
    }
    
    // Buscar dados usando o ID interno
    const [openTrades, history] = await Promise.all([
      getOpenTrades(loginResult.session, internalAccountId),
      getHistory(loginResult.session, internalAccountId)
    ]);
    
    console.log(`[MyFXBook Data] Resultado getHistory:`, {
      success: history.success,
      hasHistory: !!history.history,
      historyLength: history.history ? history.history.length : 0,
      message: history.message,
      error: history.error
    });

    // accountData já foi encontrado acima

    // Calcular datas para ganho diário (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Usar o ID interno para buscar dados diários também
    const [dailyGain, dataDaily] = await Promise.all([
      getDailyGain(loginResult.session, internalAccountId, startDateStr, endDateStr),
      getDataDaily(loginResult.session, internalAccountId, startDateStr, endDateStr)
    ]);

    // Se não encontrou a conta, ainda retornar os dados disponíveis
    if (!accountData && accountsResult.success && accountsResult.accounts.length > 0) {
      console.warn(`[MyFXBook Data] Conta com accountId ${myfxbookAccountId} não encontrada. Usando primeira conta disponível.`);
      accountData = accountsResult.accounts[0];
    }

    res.json({
      success: true,
      data: {
        connected: !!accountData,
        accountId: myfxbookAccountId,
        mt4AccountNumber: mt4Account.account_number,
        account: accountData,
        openTrades: openTrades.success ? openTrades.trades : [],
        history: history.success ? history.history : [],
        dailyGain: dailyGain.success ? dailyGain.dailyGain : [],
        dataDaily: dataDaily.success ? dataDaily.dataDaily : [],
        // Incluir mensagem se não encontrou a conta específica
        warning: !accountData ? `Conta com Account ID ${myfxbookAccountId} não encontrada no MyFXBook. Verifique se o Account ID está correto.` : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados MyFXBook.',
      error: error.message
    });
  }
};

// Adicionar conta MT4
exports.addMT4Account = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Aceitar tanto accountNumber quanto login
    const { accountNumber, login, accountName, broker, server, balance, currency, password } = req.body;
    
    const finalAccountNumber = accountNumber || login;
    
    if (!finalAccountNumber || !broker || !server) {
      return res.status(400).json({
        success: false,
        message: 'Número da conta, corretora e servidor são obrigatórios.'
      });
    }

    // Verificar se já existe uma conta com esse número para o usuário
    const existingAccount = await pool.query(
      `SELECT id FROM mt4_accounts WHERE user_id = $1 AND account_number = $2`,
      [userId, finalAccountNumber]
    );

    let result;
    if (existingAccount.rows.length > 0) {
      // Atualizar conta existente
      result = await pool.query(
        `UPDATE mt4_accounts 
         SET account_name = $3, broker = $4, server = $5, balance = $6, equity = $6, currency = $7, 
             connected_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND account_number = $2
         RETURNING *`,
        [userId, finalAccountNumber, accountName || `MT4-${finalAccountNumber}`, broker, server, balance || 0, currency || 'USD']
      );
    } else {
      // Criar nova conta
      result = await pool.query(
        `INSERT INTO mt4_accounts (user_id, account_number, account_name, broker, server, balance, equity, currency, connected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, NOW())
         RETURNING *`,
        [userId, finalAccountNumber, accountName || `MT4-${finalAccountNumber}`, broker, server, balance || 0, currency || 'USD']
      );
    }

    res.status(201).json({
      success: true,
      message: 'Conta MT4 adicionada com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar conta MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar conta MT4.',
      error: error.message
    });
  }
};

// Atualizar configurações operacionais da conta MT4
exports.updateMT4Settings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.params;
    const { automationEnabled, riskProfile } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID da conta é obrigatório.'
      });
    }

    // Verificar se a conta pertence ao usuário
    const accountCheck = await pool.query(
      'SELECT id FROM mt4_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (automationEnabled !== undefined) {
      updateFields.push(`automation_enabled = $${paramIndex}`);
      updateValues.push(automationEnabled);
      paramIndex++;
    }

    if (riskProfile !== undefined) {
      if (!['conservador', 'moderado', 'agressivo'].includes(riskProfile)) {
        return res.status(400).json({
          success: false,
          message: 'Perfil de risco inválido. Use: conservador, moderado ou agressivo.'
        });
      }
      updateFields.push(`risk_profile = $${paramIndex}`);
      updateValues.push(riskProfile);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar foi fornecido.'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(accountId);
    paramIndex++;

    const result = await pool.query(
      `UPDATE mt4_accounts 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      [...updateValues, userId]
    );

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações.',
      error: error.message
    });
  }
};

// Obter planos de investimento
exports.getInvestmentPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, min_investment, max_investment,
              expected_return, duration_days, risk_level
       FROM investment_plans WHERE is_active = TRUE
       ORDER BY min_investment ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar planos de investimento.',
      error: error.message
    });
  }
};

// Obter investimentos do usuário
exports.getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT ui.id, ui.amount, ui.status, ui.start_date, ui.end_date,
              ui.current_value, ui.profit,
              ip.name as plan_name, ip.expected_return, ip.risk_level
       FROM user_investments ui
       JOIN investment_plans ip ON ui.plan_id = ip.id
       WHERE ui.user_id = $1
       ORDER BY ui.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar investimentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar investimentos.',
      error: error.message
    });
  }
};

// Obter transações
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, status, limit = 50 } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar transações.',
      error: error.message
    });
  }
};

// Obter faturas
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, invoice_number, amount, status, due_date, paid_date,
              description, created_at
       FROM invoices WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Converter valores DECIMAL para números
    const normalizedInvoices = result.rows.map(invoice => ({
      ...invoice,
      amount: invoice.amount != null ? parseFloat(invoice.amount) : 0
    }));

    res.json({
      success: true,
      data: normalizedInvoices
    });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar faturas.',
      error: error.message
    });
  }
};

// Obter referências
exports.getReferrals = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar código de referência
    const codeResult = await pool.query(
      'SELECT referral_code FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    // Buscar referidos
    const referralsResult = await pool.query(
      `SELECT r.id, r.commission, r.commission_paid, r.status, r.created_at,
              u.first_name, u.last_name, u.email
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Estatísticas
    const statsResult = await pool.query(
      `SELECT COUNT(*) as total_referrals,
              COALESCE(SUM(commission), 0) as total_commission,
              COALESCE(SUM(CASE WHEN commission_paid = TRUE THEN commission ELSE 0 END), 0) as paid_commission
       FROM referrals WHERE referrer_id = $1`,
      [userId]
    );

    // Converter valores DECIMAL para números
    const normalizedReferrals = referralsResult.rows.map(ref => ({
      ...ref,
      commission: ref.commission != null ? parseFloat(ref.commission) : 0
    }));

    const normalizedStats = statsResult.rows[0] ? {
      ...statsResult.rows[0],
      total_commission: statsResult.rows[0].total_commission != null ? parseFloat(statsResult.rows[0].total_commission) : 0,
      paid_commission: statsResult.rows[0].paid_commission != null ? parseFloat(statsResult.rows[0].paid_commission) : 0
    } : null;

    res.json({
      success: true,
      data: {
        referralCode: codeResult.rows[0]?.referral_code,
        referrals: normalizedReferrals,
        stats: normalizedStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar referências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar referências.',
      error: error.message
    });
  }
};
