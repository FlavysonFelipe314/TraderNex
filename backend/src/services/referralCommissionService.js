const pool = require('../config/database');

/**
 * Calcula a taxa de performance da corretora baseada no valor do investimento
 * @param {number} investmentAmount - Valor do investimento
 * @returns {number} Percentual da taxa de performance (50, 40 ou 30)
 */
function calculateBrokerPerformanceFee(investmentAmount) {
  if (investmentAmount >= 1000 && investmentAmount < 5000) {
    return 50; // 50% do lucro
  } else if (investmentAmount >= 5000 && investmentAmount < 10000) {
    return 40; // 40% do lucro
  } else if (investmentAmount >= 10000) {
    return 30; // 30% do lucro
  }
  // Se for menor que 1000, retorna 50% como padrão
  return 50;
}

/**
 * Calcula a comissão do indicador (10% do lucro líquido da corretora)
 * @param {number} profit - Lucro total do investimento
 * @param {number} investmentAmount - Valor do investimento
 * @returns {Object} Objeto com os cálculos detalhados
 */
function calculateReferralCommission(profit, investmentAmount) {
  // Calcular taxa de performance da corretora
  const brokerFeePercentage = calculateBrokerPerformanceFee(investmentAmount);
  
  // Lucro líquido do investimento (lucro total)
  const netProfit = profit;
  
  // Lucro da corretora (percentual do lucro)
  const brokerProfit = (netProfit * brokerFeePercentage) / 100;
  
  // Lucro do cliente (restante)
  const clientProfit = netProfit - brokerProfit;
  
  // Comissão do indicador (10% do lucro da corretora)
  const referralCommission = (brokerProfit * 10) / 100;
  
  return {
    netProfit,
    brokerFeePercentage,
    brokerProfit,
    clientProfit,
    referralCommission
  };
}

/**
 * Processa comissão de indicação quando há lucro
 * @param {string} userId - ID do usuário que teve lucro
 * @param {number} profit - Lucro total
 * @param {number} investmentAmount - Valor do investimento
 * @param {string} investmentId - ID do investimento (opcional)
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processReferralCommission(userId, profit, investmentAmount, investmentId = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar se o usuário foi indicado por alguém
    const profileResult = await client.query(
      'SELECT referred_by FROM client_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profileResult.rows.length === 0 || !profileResult.rows[0].referred_by) {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Usuário não foi indicado por ninguém',
        commission: null
      };
    }
    
    const referrerId = profileResult.rows[0].referred_by;
    
    // Calcular comissão
    const calculation = calculateReferralCommission(profit, investmentAmount);
    
    if (calculation.referralCommission <= 0) {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Sem comissão a processar (lucro zero ou negativo)',
        commission: null
      };
    }
    
    // Verificar se já existe um registro de referral
    const existingReferral = await client.query(
      'SELECT id, commission FROM referrals WHERE referrer_id = $1 AND referred_id = $2',
      [referrerId, userId]
    );
    
    let referralId;
    let newCommission;
    
    if (existingReferral.rows.length > 0) {
      // Atualizar comissão existente
      referralId = existingReferral.rows[0].id;
      const currentCommission = parseFloat(existingReferral.rows[0].commission) || 0;
      newCommission = currentCommission + calculation.referralCommission;
      
      await client.query(
        `UPDATE referrals 
         SET commission = $1,
             investment_amount = COALESCE(investment_amount, 0) + $2,
             profit_amount = COALESCE(profit_amount, 0) + $3,
             broker_fee_percentage = $4,
             broker_profit = COALESCE(broker_profit, 0) + $5,
             last_commission_date = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          newCommission,
          investmentAmount,
          profit,
          calculation.brokerFeePercentage,
          calculation.brokerProfit,
          referralId
        ]
      );
    } else {
      // Criar novo registro de referral
      const insertResult = await client.query(
        `INSERT INTO referrals (
           referrer_id, referred_id, commission, status,
           investment_amount, profit_amount, broker_fee_percentage,
           broker_profit, last_commission_date
         )
         VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          referrerId,
          userId,
          calculation.referralCommission,
          investmentAmount,
          profit,
          calculation.brokerFeePercentage,
          calculation.brokerProfit
        ]
      );
      referralId = insertResult.rows[0].id;
      newCommission = calculation.referralCommission;
    }
    
    // Criar transação para o indicador
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'referral_bonus', $2, 'completed', 
               $3, $4)`,
      [
        referrerId,
        calculation.referralCommission,
        `Comissão de indicação: ${calculation.referralCommission.toFixed(2)} (10% da taxa de performance)`,
        referralId
      ]
    );
    
    // Atualizar saldo do indicador no perfil
    await client.query(
      `UPDATE client_profiles 
       SET balance = balance + $1,
           total_profit = total_profit + $1
       WHERE user_id = $2`,
      [calculation.referralCommission, referrerId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Comissão processada com sucesso',
      commission: {
        referralId,
        amount: calculation.referralCommission,
        brokerProfit: calculation.brokerProfit,
        brokerFeePercentage: calculation.brokerFeePercentage,
        calculation
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar comissão de indicação:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtém estatísticas de comissões de um indicador
 * @param {string} referrerId - ID do indicador
 * @returns {Promise<Object>} Estatísticas de comissões
 */
async function getReferralStats(referrerId) {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_referrals,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_referrals,
         COALESCE(SUM(commission), 0) as total_commission,
         COALESCE(SUM(CASE WHEN commission_paid = FALSE THEN commission ELSE 0 END), 0) as pending_commission,
         COALESCE(SUM(CASE WHEN commission_paid = TRUE THEN commission ELSE 0 END), 0) as paid_commission
       FROM referrals
       WHERE referrer_id = $1`,
      [referrerId]
    );
    
    const stats = result.rows[0];
    
    return {
      success: true,
      data: {
        totalReferrals: parseInt(stats.total_referrals) || 0,
        activeReferrals: parseInt(stats.active_referrals) || 0,
        totalCommission: parseFloat(stats.total_commission) || 0,
        pendingCommission: parseFloat(stats.pending_commission) || 0,
        paidCommission: parseFloat(stats.paid_commission) || 0
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de indicações:', error);
    throw error;
  }
}

module.exports = {
  calculateBrokerPerformanceFee,
  calculateReferralCommission,
  processReferralCommission,
  getReferralStats
};
