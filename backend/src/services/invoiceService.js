const pool = require('../config/database');
const { calculateBrokerPerformanceFee } = require('./referralCommissionService');

/**
 * Gera número de fatura único
 * @returns {string} Número da fatura no formato INV-YYYYMMDD-XXXX
 */
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

/**
 * Calcula a taxa de performance baseada no plano do usuário
 * @param {number} planMinInvestment - Valor mínimo do plano do usuário
 * @returns {number} Percentual da taxa de performance (50, 40 ou 30)
 */
function calculatePerformanceFeeByPlan(planMinInvestment) {
  // Baseado nos planos:
  // Nex Start: min_investment = 1000 (50%)
  // Nex Pro: min_investment = 5000 (40%)
  // Nex Prime: min_investment = 10000 (30%)
  
  if (planMinInvestment >= 10000) {
    return 30; // Nex Prime: 30%
  } else if (planMinInvestment >= 5000) {
    return 40; // Nex Pro: 40%
  } else if (planMinInvestment >= 1000) {
    return 50; // Nex Start: 50%
  } else {
    // Padrão para valores menores que 1000
    return 50; // Nex Start: 50%
  }
}

/**
 * Calcula a performance fee que o cliente deve pagar à corretora
 * Baseado no plano do usuário, não no investimento individual
 * @param {number} profit - Lucro total
 * @param {number} planMinInvestment - Valor mínimo do plano do usuário
 * @returns {number} Valor da performance fee
 */
function calculatePerformanceFee(profit, planMinInvestment) {
  const brokerFeePercentage = calculatePerformanceFeeByPlan(planMinInvestment);
  return (profit * brokerFeePercentage) / 100;
}

/**
 * Obtém o plano do usuário e calcula a taxa baseada nele
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Dados do plano e taxa
 */
async function getUserPlanAndFee(userId) {
  try {
    const result = await pool.query(
      `SELECT cp.selected_plan_id, ip.name as plan_name, ip.min_investment, ip.max_investment
       FROM client_profiles cp
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE cp.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].selected_plan_id) {
      // Se não tem plano, usar padrão (Nex Start - 50%)
      return {
        planId: null,
        planName: 'Nex Start',
        minInvestment: 1000,
        feePercentage: 50
      };
    }
    
    const plan = result.rows[0];
    const minInvestment = parseFloat(plan.min_investment) || 1000;
    const feePercentage = calculatePerformanceFeeByPlan(minInvestment);
    
    return {
      planId: plan.selected_plan_id,
      planName: plan.plan_name || 'Nex Start',
      minInvestment: minInvestment,
      feePercentage: feePercentage
    };
  } catch (error) {
    console.error('Erro ao buscar plano do usuário:', error);
    // Retornar padrão em caso de erro
    return {
      planId: null,
      planName: 'Nex Start',
      minInvestment: 1000,
      feePercentage: 50
    };
  }
}

/**
 * Calcula a próxima sexta-feira a partir de uma data
 * @param {Date} fromDate - Data de referência
 * @returns {Date} Próxima sexta-feira
 */
function getNextFriday(fromDate = new Date()) {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay(); // 0 = domingo, 5 = sexta
  
  // Se já é sexta-feira, usar a próxima
  let daysUntilFriday = 5 - dayOfWeek;
  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7; // Próxima sexta-feira
  }
  
  date.setDate(date.getDate() + daysUntilFriday);
  date.setHours(23, 59, 59, 999); // Final do dia
  
  return date;
}

/**
 * Cria uma fatura de performance fee para o cliente
 * Baseado no plano do usuário, não no investimento individual
 * @param {string} userId - ID do usuário
 * @param {number} profit - Lucro total no período
 * @param {Date} periodStart - Data inicial do período
 * @param {Date} periodEnd - Data final do período
 * @param {string} description - Descrição da fatura
 * @returns {Promise<Object>} Fatura criada
 */
async function createPerformanceInvoice(userId, profit, periodStart, periodEnd, description = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Buscar plano do usuário
    const planData = await getUserPlanAndFee(userId);
    
    // Calcular performance fee baseado no plano
    const performanceFee = calculatePerformanceFee(profit, planData.minInvestment);
    
    if (performanceFee <= 0) {
      await client.query('COMMIT');
      return {
        success: false,
        message: 'Performance fee zero ou negativa, fatura não criada',
        invoice: null
      };
    }
    
    // Gerar número da fatura
    const invoiceNumber = generateInvoiceNumber();
    
    // Calcular data de vencimento (próxima sexta-feira)
    const dueDate = getNextFriday(periodEnd);
    
    // Criar descrição padrão se não fornecida
    const invoiceDescription = description || 
      `Performance Fee Semanal - ${planData.planName} | Período: ${periodStart.toLocaleDateString('pt-BR')} a ${periodEnd.toLocaleDateString('pt-BR')} | Lucro: $ ${profit.toFixed(2)} | Taxa: ${planData.feePercentage}%`;
    
    // Inserir fatura com informações detalhadas
    const result = await client.query(
      `INSERT INTO invoices (user_id, invoice_number, amount, profit_amount, fee_percentage, plan_name, status, due_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
       RETURNING *`,
      [userId, invoiceNumber, performanceFee, profit, planData.feePercentage, planData.planName, dueDate, invoiceDescription]
    );
    
    const invoice = result.rows[0];
    
    // Criar transação relacionada
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'fee', $2, 'pending', $3, $4)`,
      [
        userId,
        performanceFee,
        `Performance Fee - Fatura ${invoiceNumber} (${planData.planName})`,
        invoice.id
      ]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Fatura criada com sucesso',
      invoice: {
        ...invoice,
        amount: parseFloat(invoice.amount),
        planName: planData.planName,
        feePercentage: planData.feePercentage,
        profit: profit
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar fatura:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gera faturas semanais baseadas na performance dos investimentos
 * Agrupa todos os lucros da semana e cria uma fatura única baseada no plano
 * @param {string} userId - ID do usuário
 * @param {Date} weekStart - Início da semana
 * @param {Date} weekEnd - Fim da semana
 * @returns {Promise<Object>} Resultado da geração
 */
async function generateWeeklyInvoices(userId, weekStart, weekEnd) {
  try {
    // Buscar investimentos ativos do usuário com lucro novo na semana
    const investmentsResult = await pool.query(
      `SELECT id, amount, profit, current_value, 
              COALESCE(last_weekly_profit, 0) as last_weekly_profit
       FROM user_investments
       WHERE user_id = $1 AND status = 'active'
       AND profit > COALESCE(last_weekly_profit, 0)`,
      [userId]
    );
    
    if (investmentsResult.rows.length === 0) {
      return {
        success: true,
        message: 'Nenhum lucro novo no período',
        invoices: []
      };
    }
    
    // Somar todos os lucros novos da semana
    let totalWeeklyProfit = 0;
    const investmentIds = [];
    
    for (const investment of investmentsResult.rows) {
      const currentProfit = parseFloat(investment.profit) || 0;
      const lastWeeklyProfit = parseFloat(investment.last_weekly_profit) || 0;
      const profitDifference = currentProfit - lastWeeklyProfit;
      
      if (profitDifference > 0) {
        totalWeeklyProfit += profitDifference;
        investmentIds.push(investment.id);
      }
    }
    
    if (totalWeeklyProfit <= 0) {
      return {
        success: true,
        message: 'Nenhum lucro novo para gerar fatura',
        invoices: []
      };
    }
    
    // Buscar plano do usuário
    const planData = await getUserPlanAndFee(userId);
    
    // Criar uma única fatura para toda a semana (baseada no plano)
    // A descrição será gerada automaticamente com todas as informações
    const invoiceResult = await createPerformanceInvoice(
      userId,
      totalWeeklyProfit,
      weekStart,
      weekEnd,
      null // Deixar gerar descrição automática com plano e lucro
    );
    
    if (invoiceResult.success) {
      // Atualizar last_weekly_profit de todos os investimentos processados
      for (const investmentId of investmentIds) {
        const investment = investmentsResult.rows.find(inv => inv.id === investmentId);
        if (investment) {
          await pool.query(
            `UPDATE user_investments
             SET last_weekly_profit = $1,
                 last_weekly_processed_date = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [parseFloat(investment.profit), investmentId]
          );
        }
      }
      
      return {
        success: true,
        message: 'Fatura semanal gerada com sucesso',
        invoices: [invoiceResult.invoice]
      };
    }
    
    return {
      success: false,
      message: 'Erro ao gerar fatura',
      invoices: []
    };
  } catch (error) {
    console.error('Erro ao gerar faturas semanais:', error);
    throw error;
  }
}

/**
 * Marca uma fatura como paga
 * @param {string} invoiceId - ID da fatura
 * @param {Date} paidDate - Data do pagamento
 * @returns {Promise<Object>} Resultado da atualização
 */
async function markInvoiceAsPaid(invoiceId, paidDate = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const paymentDate = paidDate || new Date();
    
    // Atualizar fatura
    const result = await client.query(
      `UPDATE invoices 
       SET status = 'paid', 
           paid_date = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paymentDate, invoiceId]
    );
    
    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return {
        success: false,
        message: 'Fatura não encontrada'
      };
    }
    
    const invoice = result.rows[0];
    
    // Atualizar transação relacionada
    await client.query(
      `UPDATE transactions 
       SET status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE reference = $1 AND type = 'fee'`,
      [invoiceId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Fatura marcada como paga',
      invoice: {
        ...invoice,
        amount: parseFloat(invoice.amount)
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao marcar fatura como paga:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtém faturas pendentes de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Lista de faturas pendentes
 */
async function getPendingInvoices(userId) {
  try {
    const result = await pool.query(
      `SELECT id, invoice_number, amount, status, due_date, created_at, description
       FROM invoices
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY due_date ASC`,
      [userId]
    );
    
    return {
      success: true,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount)
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar faturas pendentes:', error);
    throw error;
  }
}

module.exports = {
  generateInvoiceNumber,
  calculatePerformanceFee,
  calculatePerformanceFeeByPlan,
  getUserPlanAndFee,
  getNextFriday,
  createPerformanceInvoice,
  generateWeeklyInvoices,
  markInvoiceAsPaid,
  getPendingInvoices
};
