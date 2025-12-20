const pool = require('../config/database');
const { processInvestmentProfit, processMT4AccountProfit } = require('../services/profitProcessingService');
const { createPerformanceInvoice, generateWeeklyInvoices, markInvoiceAsPaid } = require('../services/invoiceService');
const { getReferralStats } = require('../services/referralCommissionService');

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
 * Query params: startDate (yyyy-mm-dd), endDate (yyyy-mm-dd)
 */
exports.getMyfxbookData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

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
    const {
      loginMyfxbook,
      getMyAccounts,
      getOpenTrades,
      getOpenOrders,
      getHistory,
      getDailyGain,
      getGain,
      getDataDaily,
      getWatchedAccounts,
      getCommunityOutlook
    } = require('../services/myfxbookService');
    
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

    // Calcular datas padrão se não fornecidas (últimos 30 dias)
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (!finalStartDate || !finalEndDate) {
      const today = new Date();
      finalEndDate = today.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      finalStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    // Buscar TODOS os dados disponíveis em paralelo
    const [
      openTradesResult,
      openOrdersResult,
      historyResult,
      dailyGainResult,
      gainResult,
      dataDailyResult,
      watchedAccountsResult,
      communityOutlookResult
    ] = await Promise.all([
      getOpenTrades(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getOpenOrders(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getHistory(loginResult.session, internalId).catch(err => ({ success: false, message: err.message })),
      getDailyGain(loginResult.session, internalId, finalStartDate, finalEndDate).catch(err => ({ success: false, message: err.message })),
      getGain(loginResult.session, internalId, finalStartDate, finalEndDate).catch(err => ({ success: false, message: err.message })),
      getDataDaily(loginResult.session, internalId, finalStartDate, finalEndDate).catch(err => ({ success: false, message: err.message })),
      getWatchedAccounts(loginResult.session).catch(err => ({ success: false, message: err.message })),
      getCommunityOutlook(loginResult.session).catch(err => ({ success: false, message: err.message }))
    ]);

    console.log('[getMyfxbookData] Dados recebidos:', {
      openTrades: openTradesResult.success ? (openTradesResult.openTrades?.length || 0) : 0,
      openOrders: openOrdersResult.success ? (openOrdersResult.openOrders?.length || 0) : 0,
      history: historyResult.success ? (historyResult.history?.length || 0) : 0,
      dailyGain: dailyGainResult.success ? (dailyGainResult.dailyGain?.length || 0) : 0,
      dataDaily: dataDailyResult.success ? (dataDailyResult.dataDaily?.length || 0) : 0,
      gain: gainResult.success ? gainResult.value : null,
      period: { startDate: finalStartDate, endDate: finalEndDate }
    });

    res.json({
      success: true,
      data: {
        connected: true,
        accountId: targetAccount.accountId,
        mt4AccountNumber: mt4Account.account_number,
        period: {
          startDate: finalStartDate,
          endDate: finalEndDate
        },
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
          currency: targetAccount.currency || 'USD',
          profitFactor: targetAccount.profitFactor,
          sharpeRatio: targetAccount.sharpeRatio,
          sortinoRatio: targetAccount.sortinoRatio,
          calmarRatio: targetAccount.calmarRatio,
          maxDrawdown: targetAccount.maxDrawdown,
          maxDrawdownDate: targetAccount.maxDrawdownDate,
          maxDrawdownValue: targetAccount.maxDrawdownValue,
          interest: targetAccount.interest,
          commission: targetAccount.commission
        },
        openTrades: openTradesResult.success ? (openTradesResult.openTrades || []) : [],
        openOrders: openOrdersResult.success ? (openOrdersResult.openOrders || []) : [],
        history: historyResult.success ? (historyResult.history || []) : [],
        dailyGain: dailyGainResult.success ? (dailyGainResult.dailyGain || []) : [],
        gain: gainResult.success ? gainResult.value : null,
        dataDaily: dataDailyResult.success ? (dataDailyResult.dataDaily || []) : [],
        watchedAccounts: watchedAccountsResult.success ? (watchedAccountsResult.watchedAccounts || []) : [],
        communityOutlook: communityOutlookResult.success ? {
          symbols: communityOutlookResult.symbols || [],
          general: communityOutlookResult.general || {}
        } : null
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
      `SELECT i.id, i.invoice_number, i.amount, i.status, i.due_date, i.paid_date, 
              i.created_at, i.description,
              cp.selected_plan_id, ip.name as plan_name, ip.min_investment
       FROM invoices i
       LEFT JOIN client_profiles cp ON cp.user_id = i.user_id
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE i.user_id = $1
       ORDER BY i.due_date DESC, i.created_at DESC`,
      [userId]
    );

    // Calcular totais
    const totals = result.rows.reduce((acc, row) => {
      const amount = parseFloat(row.amount) || 0;
      acc.total += amount;
      if (row.status === 'pending') acc.pending += amount;
      if (row.status === 'paid') acc.paid += amount;
      if (row.status === 'overdue') acc.overdue += amount;
      return acc;
    }, { total: 0, pending: 0, paid: 0, overdue: 0 });

    // Calcular próximo vencimento (próxima sexta-feira)
    const now = new Date();
    const dayOfWeek = now.getDay();
    let daysUntilFriday = 5 - dayOfWeek;
    if (daysUntilFriday <= 0) daysUntilFriday += 7;
    const nextDueDate = new Date(now);
    nextDueDate.setDate(now.getDate() + daysUntilFriday);
    
    // Calcular número da semana
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0,
        profit_amount: parseFloat(row.profit_amount) || 0,
        fee_percentage: parseFloat(row.fee_percentage) || 0,
        planName: row.plan_name || row.plan_name_from_profile || 'Nex Start',
        minInvestment: parseFloat(row.min_investment) || 1000
      })),
      totals,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      weekNumber: weekNumber
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

    // Buscar indicações feitas por este usuário com mais detalhes
    const referralsResult = await pool.query(
      `SELECT r.id, r.commission, r.status, r.created_at, r.last_commission_date,
              r.investment_amount, r.profit_amount, r.broker_fee_percentage, r.broker_profit,
              u.email as referred_email, u.first_name as referred_first_name, u.last_name as referred_last_name,
              cp.account_type as referred_account_type
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       LEFT JOIN client_profiles cp ON cp.user_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.last_commission_date DESC NULLS LAST, r.created_at DESC`,
      [userId]
    );

    // Buscar estatísticas adicionais
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_referrals,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_referrals,
         COALESCE(SUM(commission), 0) as total_commission,
         COALESCE(SUM(CASE WHEN commission_paid = FALSE THEN commission ELSE 0 END), 0) as pending_commission
       FROM referrals
       WHERE referrer_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    // Calcular comissão disponível para saque (não paga)
    const availableForWithdrawal = parseFloat(stats.pending_commission) || 0;
    const totalEarnings = parseFloat(stats.total_commission) || 0;

    res.json({
      success: true,
      data: {
        referralCode,
        totalReferrals: parseInt(stats.total_referrals) || 0,
        activeReferrals: parseInt(stats.active_referrals) || 0,
        totalEarnings,
        availableForWithdrawal,
        referrals: referralsResult.rows.map(row => ({
          id: row.id,
          referredName: `${row.referred_first_name || ''} ${row.referred_last_name || ''}`.trim() || row.referred_email,
          referredEmail: row.referred_email,
          referredAccountType: row.referred_account_type,
          commission: parseFloat(row.commission) || 0,
          investmentAmount: parseFloat(row.investment_amount) || 0,
          profitAmount: parseFloat(row.profit_amount) || 0,
          brokerFeePercentage: parseFloat(row.broker_fee_percentage) || 0,
          brokerProfit: parseFloat(row.broker_profit) || 0,
          status: row.status,
          createdAt: row.created_at,
          lastCommissionDate: row.last_commission_date
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

// Processar lucro de investimento (endpoint para uso interno/admin)
exports.processInvestmentProfit = async (req, res) => {
  try {
    const { investmentId, newProfit, previousProfit } = req.body;
    const userId = req.user.userId;

    if (!investmentId || newProfit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'investmentId e newProfit são obrigatórios'
      });
    }

    const result = await processInvestmentProfit(
      userId,
      investmentId,
      parseFloat(newProfit),
      parseFloat(previousProfit || 0)
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao processar lucro do investimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar lucro do investimento.',
      error: error.message
    });
  }
};

// Processar lucro de conta MT4
exports.processMT4Profit = async (req, res) => {
  try {
    const { mt4AccountId, profit, investmentAmount } = req.body;
    const userId = req.user.userId;

    if (!mt4AccountId || profit === undefined || investmentAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'mt4AccountId, profit e investmentAmount são obrigatórios'
      });
    }

    const result = await processMT4AccountProfit(
      userId,
      mt4AccountId,
      parseFloat(profit),
      parseFloat(investmentAmount)
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao processar lucro da conta MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar lucro da conta MT4.',
      error: error.message
    });
  }
};

// Criar fatura de performance
exports.createPerformanceInvoice = async (req, res) => {
  try {
    const { profit, periodStart, periodEnd, description } = req.body;
    const userId = req.user.userId;

    if (!profit) {
      return res.status(400).json({
        success: false,
        message: 'profit é obrigatório'
      });
    }

    const startDate = periodStart ? new Date(periodStart) : new Date();
    const endDate = periodEnd ? new Date(periodEnd) : new Date();

    const result = await createPerformanceInvoice(
      userId,
      parseFloat(profit),
      startDate,
      endDate,
      description
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao criar fatura de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar fatura de performance.',
      error: error.message
    });
  }
};

// Gerar faturas semanais
exports.generateWeeklyInvoices = async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.body;
    const userId = req.user.userId;

    const startDate = weekStart ? new Date(weekStart) : new Date();
    const endDate = weekEnd ? new Date(weekEnd) : new Date();

    // Se não fornecido, usar a semana atual
    if (!weekStart) {
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Domingo
      startDate.setHours(0, 0, 0, 0);
    }
    if (!weekEnd) {
      endDate.setDate(startDate.getDate() + 6); // Sábado
      endDate.setHours(23, 59, 59, 999);
    }

    const result = await generateWeeklyInvoices(userId, startDate, endDate);

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar faturas semanais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar faturas semanais.',
      error: error.message
    });
  }
};

// Marcar fatura como paga
exports.markInvoiceAsPaid = async (req, res) => {
  try {
    const { invoiceId, paidDate } = req.body;
    const userId = req.user.userId;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'invoiceId é obrigatório'
      });
    }

    // Verificar se a fatura pertence ao usuário
    const invoiceCheck = await pool.query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fatura não encontrada ou não pertence ao usuário'
      });
    }

    const paymentDate = paidDate ? new Date(paidDate) : null;
    const result = await markInvoiceAsPaid(invoiceId, paymentDate);

    res.json(result);
  } catch (error) {
    console.error('Erro ao marcar fatura como paga:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar fatura como paga.',
      error: error.message
    });
  }
};
