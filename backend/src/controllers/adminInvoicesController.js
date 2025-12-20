const pool = require('../config/database');

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
