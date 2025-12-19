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
          balance: parseFloat(profile.balance) || 0,
          total_invested: parseFloat(profile.total_invested) || 0,
          total_profit: parseFloat(profile.total_profit) || 0,
          profit_percentage: parseFloat(profile.profit_percentage) || 0,
          account_type: profile.account_type
        },
        mt4: {
          total_accounts: parseInt(mt4Result.rows[0].total_accounts) || 0,
          total_balance: parseFloat(mt4Result.rows[0].total_balance) || 0,
          total_equity: parseFloat(mt4Result.rows[0].total_equity) || 0
        },
        transactions: transactionsResult.rows.map(t => ({
          ...t,
          amount: parseFloat(t.amount) || 0
        })),
        investments: {
          active_investments: parseInt(investmentsResult.rows[0].active_investments) || 0,
          total_invested_amount: parseFloat(investmentsResult.rows[0].total_invested_amount) || 0,
          current_total_value: parseFloat(investmentsResult.rows[0].current_total_value) || 0
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
      `SELECT id, account_number, account_name, broker, server, balance, equity, currency, status, connected_at, last_sync, automation_enabled, risk_profile, created_at
       FROM mt4_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Converter valores DECIMAL para números
    const normalizedData = result.rows.map(row => ({
      ...row,
      balance: row.balance != null ? parseFloat(row.balance) : 0,
      equity: row.equity != null ? parseFloat(row.equity) : 0
    }));

    res.json({
      success: true,
      data: normalizedData
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

// Adicionar conta MT4
exports.addMT4Account = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { account_number, account_name, broker, server, balance, equity, currency } = req.body;

    if (!account_number || !broker || !server) {
      return res.status(400).json({
        success: false,
        message: 'Número da conta, corretora e servidor são obrigatórios.'
      });
    }

    // Verificar se já existe uma conta com o mesmo número para este usuário
    const existingAccount = await pool.query(
      'SELECT id FROM mt4_accounts WHERE user_id = $1 AND account_number = $2',
      [userId, account_number]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma conta MT4 com este número para seu usuário.'
      });
    }

    const result = await pool.query(
      `INSERT INTO mt4_accounts (user_id, account_number, account_name, broker, server, balance, equity, currency, status, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
       RETURNING *`,
      [userId, account_number, account_name || null, broker, server, balance || 0, equity || 0, currency || 'USD']
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Conta MT4 adicionada com sucesso!'
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
    const { automation_enabled, risk_profile } = req.body;

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

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (automation_enabled !== undefined) {
      updateFields.push(`automation_enabled = $${paramIndex}`);
      updateValues.push(automation_enabled);
      paramIndex++;
    }

    if (risk_profile !== undefined) {
      if (!['conservador', 'moderado', 'agressivo'].includes(risk_profile)) {
        return res.status(400).json({
          success: false,
          message: 'Perfil de risco inválido.'
        });
      }
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

    const result = await pool.query(
      `UPDATE mt4_accounts SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Configurações atualizadas com sucesso!'
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
    console.log('[getMyfxbookData] Buscando conta com accountId:', myfxbookAccountId);
    const accountsResult = await getMyAccounts(loginResult.session);
    
    if (!accountsResult.success || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Nenhuma conta encontrada no MyFXBook.'
        }
      });
    }

    // Encontrar a conta com o accountId configurado
    const targetAccount = accountsResult.accounts.find(acc => acc.accountId && acc.accountId.toString() === myfxbookAccountId.toString());
    
    if (!targetAccount) {
      console.log('[getMyfxbookData] Conta não encontrada. AccountId procurado:', myfxbookAccountId);
      console.log('[getMyfxbookData] Contas disponíveis:', accountsResult.accounts.map(acc => ({ accountId: acc.accountId, name: acc.name })));
      return res.json({
        success: true,
        data: {
          connected: false,
          message: `Conta MyFXBook com Account Number ${myfxbookAccountId} não encontrada.`,
          warning: 'O Account Number configurado não corresponde a nenhuma conta no MyFXBook.'
        }
      });
    }

    console.log('[getMyfxbookData] Conta encontrada:', { id: targetAccount.id, accountId: targetAccount.accountId, name: targetAccount.name });

    // Usar o ID interno da conta para buscar dados
    const internalId = targetAccount.id;

    // Buscar dados em paralelo
    const [openTradesResult, historyResult, dailyGainResult, dataDailyResult] = await Promise.all([
      getOpenTrades(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getHistory(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getDailyGain(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getDataDaily(loginResult.session, internalId).catch(err => ({ success: false, message: err.message }))
    ]);

    console.log('[getMyfxbookData] Histórico recebido:', {
      success: historyResult.success,
      length: historyResult.history ? historyResult.history.length : 0,
      firstRecord: historyResult.history && historyResult.history.length > 0 ? historyResult.history[0] : null
    });

    res.json({
      success: true,
      data: {
        connected: true,
        accountId: targetAccount.accountId,
        mt4AccountNumber: mt4Account.account_number,
        account: {
          id: targetAccount.id,
          accountId: targetAccount.accountId,
          name: targetAccount.name,
          gain: targetAccount.gain,
          profit: targetAccount.profit,
          drawdown: targetAccount.drawdown,
          equity: targetAccount.equity,
          balance: targetAccount.balance,
          absGain: targetAccount.absGain,
          daily: targetAccount.daily,
          monthly: targetAccount.monthly,
          currency: targetAccount.currency || 'USD'
        },
        openTrades: openTradesResult.success ? (openTradesResult.openTrades || []) : [],
        history: historyResult.success ? (historyResult.history || []) : [],
        dailyGain: dailyGainResult.success ? (dailyGainResult.dailyGain || []) : [],
        dataDaily: dataDailyResult.success ? (dataDailyResult.dataDaily || []) : []
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

// Selecionar plano de investimento
exports.selectInvestmentPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do plano é obrigatório.'
      });
    }

    // Verificar se o plano existe e está ativo
    const planCheck = await pool.query(
      'SELECT id, name FROM investment_plans WHERE id = $1 AND is_active = TRUE',
      [plan_id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado ou inativo.'
      });
    }

    // Verificar se o perfil existe, se não, criar
    const profileCheck = await pool.query(
      'SELECT id FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileCheck.rows.length === 0) {
      // Criar perfil se não existir
      await pool.query(
        `INSERT INTO client_profiles (user_id, selected_plan_id)
         VALUES ($1, $2)`,
        [userId, plan_id]
      );
    } else {
      // Atualizar perfil existente
      await pool.query(
        `UPDATE client_profiles
         SET selected_plan_id = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [plan_id, userId]
      );
    }

    res.json({
      success: true,
      data: {
        plan_id: plan_id,
        plan_name: planCheck.rows[0].name
      },
      message: `Plano ${planCheck.rows[0].name} selecionado com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao selecionar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao selecionar plano.',
      error: error.message
    });
  }
};

// Obter investimentos do usuário
exports.getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT ui.id, ui.amount, ui.current_value, ui.status, ui.created_at,
              ip.name as plan_name, ip.expected_return
       FROM user_investments ui
       JOIN investment_plans ip ON ui.plan_id = ip.id
       WHERE ui.user_id = $1
       ORDER BY ui.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0,
        current_value: parseFloat(row.current_value) || 0
      }))
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

// Obter transações do usuário
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, limit = 50, offset = 0 } = req.query;

    let query = `SELECT id, type, amount, status, description, created_at
                 FROM transactions WHERE user_id = $1`;
    const queryParams = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0
      }))
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

// Obter faturas do usuário
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, invoice_number, amount, status, due_date, created_at
       FROM invoices WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0
      }))
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

// Obter dados de indicações do usuário
exports.getReferrals = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar código de referência do usuário
    const profileResult = await pool.query(
      'SELECT referral_code FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    const referralCode = profileResult.rows[0]?.referral_code || null;

    // Buscar indicações feitas por este usuário
    const referralsResult = await pool.query(
      `SELECT r.id, r.commission, r.status, r.created_at,
              u.email as referred_email, u.first_name as referred_first_name, u.last_name as referred_last_name
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Calcular totais
    const totalReferrals = referralsResult.rows.length;
    const totalEarnings = referralsResult.rows.reduce((sum, ref) => {
      return sum + (parseFloat(ref.commission) || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        referralCode,
        totalReferrals,
        totalEarnings,
        referrals: referralsResult.rows.map(row => ({
          ...row,
          commission: parseFloat(row.commission) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de indicações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados de indicações.',
      error: error.message
    });
  }
};
