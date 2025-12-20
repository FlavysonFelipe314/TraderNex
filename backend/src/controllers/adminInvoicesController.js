const pool = require('../config/database');
const { getUserPlanAndFee, calculatePerformanceFee, getNextFriday } = require('../services/invoiceService');

/**
 * Obter todas as faturas (Admin)
 * GET /api/admin/invoices
 */
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, userId, period } = req.query;
    
    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.amount,
        i.profit_amount,
        i.fee_percentage,
        i.plan_name,
        i.status,
        i.due_date,
        i.paid_date,
        i.created_at,
        i.description,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        cp.selected_plan_id,
        ip.name as plan_name_from_profile,
        ip.min_investment
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN client_profiles cp ON cp.user_id = u.id
      LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (userId) {
      query += ` AND i.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }
    
    if (period === 'pending') {
      query += ` AND i.status = 'pending' AND i.due_date >= CURRENT_DATE`;
    } else if (period === 'overdue') {
      query += ` AND i.status = 'pending' AND i.due_date < CURRENT_DATE`;
    }
    
    query += ` ORDER BY i.due_date DESC, i.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Calcular estatísticas
    const stats = result.rows.reduce((acc, row) => {
      const amount = parseFloat(row.amount) || 0;
      acc.total += amount;
      acc.count++;
      if (row.status === 'pending') {
        acc.pending += amount;
        acc.pendingCount++;
        if (new Date(row.due_date) < new Date()) {
          acc.overdue += amount;
          acc.overdueCount++;
        }
      }
      if (row.status === 'paid') {
        acc.paid += amount;
        acc.paidCount++;
      }
      return acc;
    }, { total: 0, pending: 0, paid: 0, overdue: 0, count: 0, pendingCount: 0, paidCount: 0, overdueCount: 0 });
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0,
        profit_amount: parseFloat(row.profit_amount) || 0,
        fee_percentage: parseFloat(row.fee_percentage) || 0,
        plan_name: row.plan_name || row.plan_name_from_profile || 'Nex Start',
        minInvestment: parseFloat(row.min_investment) || 1000,
        // Garantir que plan_name está disponível
        planName: row.plan_name || row.plan_name_from_profile || 'Nex Start'
      })),
      stats
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

/**
 * Marcar fatura como paga (Admin)
 * POST /api/admin/invoices/:invoiceId/mark-paid
 */
exports.markInvoiceAsPaid = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paidDate } = req.body;
    
    const paymentDate = paidDate ? new Date(paidDate) : new Date();
    
    const result = await pool.query(
      `UPDATE invoices 
       SET status = 'paid', 
           paid_date = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paymentDate, invoiceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fatura não encontrada'
      });
    }
    
    // Atualizar transação relacionada
    await pool.query(
      `UPDATE transactions 
       SET status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE reference = $1 AND type = 'fee'`,
      [invoiceId]
    );
    
    res.json({
      success: true,
      message: 'Fatura marcada como paga',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao marcar fatura como paga:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar fatura como paga.',
      error: error.message
    });
  }
};

/**
 * Obter sugestão de valor de fatura para um usuário (Admin)
 * GET /api/admin/invoices/suggest/:userId
 */
exports.getInvoiceSuggestion = async (req, res) => {
  try {
    const { userId } = req.params;
    const { periodStart, periodEnd } = req.query;
    
    // Calcular período da semana (segunda a sexta) se não fornecido
    let weekStart, weekEnd;
    if (periodStart && periodEnd) {
      weekStart = new Date(periodStart);
      weekEnd = new Date(periodEnd);
    } else {
      const now = new Date();
      const dayOfWeek = now.getDay();
      weekEnd = new Date(now);
      if (dayOfWeek !== 5) {
        const daysToSubtract = dayOfWeek < 5 ? dayOfWeek + 2 : dayOfWeek - 5;
        weekEnd.setDate(now.getDate() - daysToSubtract);
      }
      weekEnd.setHours(23, 59, 59, 999);
      weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 4);
      weekStart.setHours(0, 0, 0, 0);
    }
    
    // Buscar investimentos ativos do usuário com lucro novo na semana
    const investmentsResult = await pool.query(
      `SELECT id, amount, profit, current_value, 
              COALESCE(last_weekly_profit, 0) as last_weekly_profit
       FROM user_investments
       WHERE user_id = $1 AND status = 'active'
       AND profit > COALESCE(last_weekly_profit, 0)`,
      [userId]
    );
    
    // Somar todos os lucros novos da semana
    let totalWeeklyProfit = 0;
    for (const investment of investmentsResult.rows) {
      const currentProfit = parseFloat(investment.profit) || 0;
      const lastWeeklyProfit = parseFloat(investment.last_weekly_profit) || 0;
      const profitDifference = currentProfit - lastWeeklyProfit;
      if (profitDifference > 0) {
        totalWeeklyProfit += profitDifference;
      }
    }
    
    // Buscar plano do usuário
    const planData = await getUserPlanAndFee(userId);
    
    // Calcular performance fee sugerida
    const suggestedFee = calculatePerformanceFee(totalWeeklyProfit, planData.minInvestment);
    
    // Buscar dados do usuário
    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
        planName: planData.planName,
        feePercentage: planData.feePercentage,
        weeklyProfit: totalWeeklyProfit,
        suggestedFee: suggestedFee,
        periodStart: weekStart.toISOString(),
        periodEnd: weekEnd.toISOString(),
        dueDate: getNextFriday(weekEnd).toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao buscar sugestão de fatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestão de fatura.',
      error: error.message
    });
  }
};

/**
 * Criar fatura manualmente (Admin)
 * POST /api/admin/invoices/create-manual
 */
exports.createInvoiceManual = async (req, res) => {
  try {
    const { userId, profit, amount, periodStart, periodEnd, description } = req.body;
    
    if (!userId || !profit || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId, profit e amount são obrigatórios'
      });
    }
    
    // Buscar plano do usuário para validação
    const planData = await getUserPlanAndFee(userId);
    
    // Calcular taxa esperada
    const expectedFee = calculatePerformanceFee(profit, planData.minInvestment);
    
    // Verificar se o valor fornecido está próximo do esperado (permitir 10% de diferença)
    const difference = Math.abs(amount - expectedFee);
    const tolerance = expectedFee * 0.1;
    
    if (difference > tolerance) {
      console.warn(`[createInvoiceManual] Valor fornecido (${amount}) difere significativamente do esperado (${expectedFee})`);
    }
    
    // Gerar número da fatura
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;
    
    // Calcular vencimento (próxima sexta-feira)
    const endDate = periodEnd ? new Date(periodStart) : new Date();
    const dueDate = getNextFriday(endDate);
    
    // Criar descrição
    const invoiceDescription = description || 
      `Performance Fee Semanal Manual - ${planData.planName} | Período: ${periodStart ? new Date(periodStart).toLocaleDateString('pt-BR') : 'N/A'} a ${periodEnd ? new Date(periodEnd).toLocaleDateString('pt-BR') : 'N/A'} | Lucro: $ ${profit.toFixed(2)} | Taxa: ${planData.feePercentage}%`;
    
    // Inserir fatura
    const result = await pool.query(
      `INSERT INTO invoices (user_id, invoice_number, amount, profit_amount, fee_percentage, plan_name, status, due_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
       RETURNING *`,
      [userId, invoiceNumber, amount, profit, planData.feePercentage, planData.planName, dueDate, invoiceDescription]
    );
    
    const invoice = result.rows[0];
    
    // Criar transação relacionada
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'fee', $2, 'pending', $3, $4)`,
      [
        userId,
        amount,
        `Performance Fee Manual - Fatura ${invoiceNumber} (${planData.planName})`,
        invoice.id
      ]
    );
    
    res.json({
      success: true,
      message: 'Fatura criada manualmente com sucesso',
      data: {
        ...invoice,
        amount: parseFloat(invoice.amount),
        profit_amount: parseFloat(invoice.profit_amount) || profit,
        fee_percentage: parseFloat(invoice.fee_percentage) || planData.feePercentage
      }
    });
  } catch (error) {
    console.error('Erro ao criar fatura manual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar fatura manual.',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de faturas (Admin)
 * GET /api/admin/invoices/stats
 */
exports.getInvoiceStats = async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_invoices,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
         COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_invoices,
         COALESCE(SUM(amount), 0) as total_amount,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
         COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) as overdue_amount
       FROM invoices`
    );
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalInvoices: parseInt(stats.total_invoices) || 0,
        pendingInvoices: parseInt(stats.pending_invoices) || 0,
        paidInvoices: parseInt(stats.paid_invoices) || 0,
        overdueInvoices: parseInt(stats.overdue_invoices) || 0,
        totalAmount: parseFloat(stats.total_amount) || 0,
        pendingAmount: parseFloat(stats.pending_amount) || 0,
        paidAmount: parseFloat(stats.paid_amount) || 0,
        overdueAmount: parseFloat(stats.overdue_amount) || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de faturas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas.',
      error: error.message
    });
  }
};
