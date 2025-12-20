const pool = require('../config/database');
const { processReferralCommission } = require('./referralCommissionService');
const { createPerformanceInvoice } = require('./invoiceService');

/**
 * Processa lucro de um investimento e calcula comissões e faturas automaticamente
 * @param {string} userId - ID do usuário
 * @param {string} investmentId - ID do investimento
 * @param {number} newProfit - Novo valor de lucro
 * @param {number} previousProfit - Lucro anterior (para calcular a diferença)
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processInvestmentProfit(userId, investmentId, newProfit, previousProfit = 0) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Buscar dados do investimento
    const investmentResult = await client.query(
      `SELECT id, user_id, amount, profit, status
       FROM user_investments
       WHERE id = $1`,
      [investmentId]
    );
    
    if (investmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Investimento não encontrado'
      };
    }
    
    const investment = investmentResult.rows[0];
    const investmentAmount = parseFloat(investment.amount) || 0;
    const profitDifference = newProfit - previousProfit;
    
    // Se não há lucro novo, não processa nada
    if (profitDifference <= 0) {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Sem lucro novo para processar',
        processed: false
      };
    }
    
    // Processar comissão de indicação
    let referralCommission = null;
    try {
      const commissionResult = await processReferralCommission(
        userId,
        profitDifference,
        investmentAmount,
        investmentId
      );
      
      if (commissionResult.success && commissionResult.commission) {
        referralCommission = commissionResult.commission;
      }
    } catch (error) {
      console.error('Erro ao processar comissão de indicação:', error);
      // Continua o processamento mesmo se houver erro na comissão
    }
    
    // Atualizar lucro do investimento
    await client.query(
      `UPDATE user_investments
       SET profit = $1,
           current_value = amount + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newProfit, investmentId]
    );
    
    // Atualizar perfil do usuário
    await client.query(
      `UPDATE client_profiles
       SET total_profit = total_profit + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [profitDifference, userId]
    );
    
    // Criar transação de lucro
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'profit', $2, 'completed', $3, $4)`,
      [
        userId,
        profitDifference,
        `Lucro do investimento ${investmentId}`,
        investmentId
      ]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Lucro processado com sucesso',
      processed: true,
      profitDifference,
      referralCommission
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar lucro do investimento:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Processa lucro semanal baseado em dados do MyFXBook ou investimentos
 * @param {string} userId - ID do usuário
 * @param {Date} weekStart - Início da semana
 * @param {Date} weekEnd - Fim da semana
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processWeeklyProfit(userId, weekStart, weekEnd) {
  try {
    // Buscar investimentos ativos
    const investmentsResult = await pool.query(
      `SELECT id, amount, profit, current_value
       FROM user_investments
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    
    const results = [];
    
    for (const investment of investmentsResult.rows) {
      // Aqui você pode integrar com dados do MyFXBook para calcular o lucro real
      // Por enquanto, vamos usar o lucro já registrado
      const currentProfit = parseFloat(investment.profit) || 0;
      
      // Processar lucro (assumindo que o lucro já foi atualizado anteriormente)
      // Em um cenário real, você calcularia o lucro baseado nos dados do MyFXBook
      
      results.push({
        investmentId: investment.id,
        profit: currentProfit
      });
    }
    
    return {
      success: true,
      message: 'Lucro semanal processado',
      results
    };
  } catch (error) {
    console.error('Erro ao processar lucro semanal:', error);
    throw error;
  }
}

/**
 * Processa lucro de uma conta MT4 baseado em dados do MyFXBook
 * @param {string} userId - ID do usuário
 * @param {string} mt4AccountId - ID da conta MT4
 * @param {number} profit - Lucro da conta
 * @param {number} investmentAmount - Valor investido na conta
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processMT4AccountProfit(userId, mt4AccountId, profit, investmentAmount) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Processar comissão de indicação se houver lucro
    let referralCommission = null;
    if (profit > 0) {
      try {
        const commissionResult = await processReferralCommission(
          userId,
          profit,
          investmentAmount,
          null
        );
        
        if (commissionResult.success && commissionResult.commission) {
          referralCommission = commissionResult.commission;
        }
      } catch (error) {
        console.error('Erro ao processar comissão de indicação:', error);
      }
    }
    
    // Criar transação de lucro
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'profit', $2, 'completed', $3, $4)`,
      [
        userId,
        profit,
        `Lucro da conta MT4 ${mt4AccountId}`,
        mt4AccountId
      ]
    );
    
    // Atualizar perfil do usuário
    await client.query(
      `UPDATE client_profiles
       SET total_profit = total_profit + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [profit, userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Lucro da conta MT4 processado com sucesso',
      profit,
      referralCommission
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar lucro da conta MT4:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  processInvestmentProfit,
  processWeeklyProfit,
  processMT4AccountProfit
};
