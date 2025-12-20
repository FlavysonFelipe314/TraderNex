const pool = require('../config/database');
const { processWeeklyCommissionsManual } = require('../services/weeklyCommissionService');

/**
 * Obter todas as comissões de indicações (Admin)
 * GET /api/admin/referrals/commissions
 */
exports.getAllReferralCommissions = async (req, res) => {
  try {
    const { status, commission_paid, referrer_id } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.referrer_id,
        r.referred_id,
        r.commission,
        r.commission_paid,
        r.status,
        r.investment_amount,
        r.profit_amount,
        r.broker_fee_percentage,
        r.broker_profit,
        r.last_commission_date,
        r.created_at,
        r.updated_at,
        u1.first_name as referrer_first_name,
        u1.last_name as referrer_last_name,
        u1.email as referrer_email,
        u2.first_name as referred_first_name,
        u2.last_name as referred_last_name,
        u2.email as referred_email
      FROM referrals r
      JOIN users u1 ON r.referrer_id = u1.id
      JOIN users u2 ON r.referred_id = u2.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (commission_paid !== undefined) {
      query += ` AND r.commission_paid = $${paramCount}`;
      params.push(commission_paid === 'true');
      paramCount++;
    }
    
    if (referrer_id) {
      query += ` AND r.referrer_id = $${paramCount}`;
      params.push(referrer_id);
      paramCount++;
    }
    
    query += ` ORDER BY r.last_commission_date DESC NULLS LAST, r.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        commission: parseFloat(row.commission) || 0,
        investment_amount: parseFloat(row.investment_amount) || 0,
        profit_amount: parseFloat(row.profit_amount) || 0,
        broker_profit: parseFloat(row.broker_profit) || 0,
        broker_fee_percentage: parseFloat(row.broker_fee_percentage) || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar comissões.',
      error: error.message
    });
  }
};

/**
 * Aprovar pagamento de comissão (Admin)
 * POST /api/admin/referrals/:referralId/approve-payment
 */
exports.approveCommissionPayment = async (req, res) => {
  try {
    const { referralId } = req.params;
    
    const result = await pool.query(
      `UPDATE referrals 
       SET commission_paid = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [referralId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comissão não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Pagamento aprovado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao aprovar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar pagamento.',
      error: error.message
    });
  }
};

/**
 * Rejeitar pagamento de comissão (Admin)
 * POST /api/admin/referrals/:referralId/reject-payment
 */
exports.rejectCommissionPayment = async (req, res) => {
  try {
    const { referralId } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE referrals 
       SET commission_paid = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [referralId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comissão não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Pagamento rejeitado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao rejeitar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar pagamento.',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de comissões (Admin)
 * GET /api/admin/referrals/stats
 */
exports.getReferralCommissionStats = async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_referrals,
         COUNT(CASE WHEN commission_paid = FALSE THEN 1 END) as pending_payments,
         COUNT(CASE WHEN commission_paid = TRUE THEN 1 END) as paid_payments,
         COALESCE(SUM(commission), 0) as total_commission,
         COALESCE(SUM(CASE WHEN commission_paid = FALSE THEN commission ELSE 0 END), 0) as pending_commission,
         COALESCE(SUM(CASE WHEN commission_paid = TRUE THEN commission ELSE 0 END), 0) as paid_commission,
         COUNT(DISTINCT referrer_id) as total_referrers,
         COUNT(DISTINCT referred_id) as total_referred
       FROM referrals`
    );
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalReferrals: parseInt(stats.total_referrals) || 0,
        pendingPayments: parseInt(stats.pending_payments) || 0,
        paidPayments: parseInt(stats.paid_payments) || 0,
        totalCommission: parseFloat(stats.total_commission) || 0,
        pendingCommission: parseFloat(stats.pending_commission) || 0,
        paidCommission: parseFloat(stats.paid_commission) || 0,
        totalReferrers: parseInt(stats.total_referrers) || 0,
        totalReferred: parseInt(stats.total_referred) || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de comissões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas.',
      error: error.message
    });
  }
};

/**
 * Processar comissões semanais manualmente (Admin)
 * POST /api/admin/referrals/process-weekly
 */
exports.processWeeklyCommissions = async (req, res) => {
  try {
    const result = await processWeeklyCommissionsManual();
    
    res.json({
      success: true,
      message: 'Comissões semanais processadas com sucesso',
      data: result.results
    });
  } catch (error) {
    console.error('Erro ao processar comissões semanais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar comissões semanais.',
      error: error.message
    });
  }
};
