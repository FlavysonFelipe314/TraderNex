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
          balance: parseFloat(profile.balance),
          totalInvested: parseFloat(profile.total_invested),
          totalProfit: parseFloat(profile.total_profit),
          profitPercentage: parseFloat(profile.profit_percentage),
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
    const { period } = req.query; // day, week, month, year

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '1 day'";
        break;
      case 'week':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "report_date >= CURRENT_DATE - INTERVAL '7 days'";
    }

    const result = await pool.query(
      `SELECT report_date, total_trades, winning_trades, losing_trades,
              win_rate, total_profit, total_loss, net_profit, roi
       FROM performance_reports
       WHERE user_id = $1 AND ${dateFilter}
       ORDER BY report_date ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
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
              equity, currency, status, connected_at, last_sync
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

    const result = await pool.query(
      `INSERT INTO mt4_accounts (user_id, account_number, account_name, broker, server, balance, equity, currency, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, NOW())
       RETURNING *`,
      [userId, finalAccountNumber, accountName || `MT4-${finalAccountNumber}`, broker, server, balance || 0, currency || 'USD']
    );

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

    res.json({
      success: true,
      data: result.rows
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

    res.json({
      success: true,
      data: {
        referralCode: codeResult.rows[0]?.referral_code,
        referrals: referralsResult.rows,
        stats: statsResult.rows[0]
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
