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
 * Calcula a performance fee que o cliente deve pagar à corretora
 * @param {number} profit - Lucro total
 * @param {number} investmentAmount - Valor do investimento
 * @returns {number} Valor da performance fee
 */
function calculatePerformanceFee(profit, investmentAmount) {
  const brokerFeePercentage = calculateBrokerPerformanceFee(investmentAmount);
  return (profit * brokerFeePercentage) / 100;
}

/**
 * Cria uma fatura de performance fee para o cliente
 * @param {string} userId - ID do usuário
 * @param {number} profit - Lucro total no período
 * @param {number} investmentAmount - Valor do investimento
 * @param {Date} periodStart - Data inicial do período
 * @param {Date} periodEnd - Data final do período
 * @param {string} description - Descrição da fatura
 * @returns {Promise<Object>} Fatura criada
 */
async function createPerformanceInvoice(userId, profit, investmentAmount, periodStart, periodEnd, description = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Calcular performance fee
    const performanceFee = calculatePerformanceFee(profit, investmentAmount);
    
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
    
    // Calcular data de vencimento (7 dias a partir de hoje)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    // Criar descrição padrão se não fornecida
    const invoiceDescription = description || 
      `Performance Fee - Período: ${periodStart.toLocaleDateString('pt-BR')} a ${periodEnd.toLocaleDateString('pt-BR')}. ` +
      `Lucro: R$ ${profit.toFixed(2)}, Taxa: ${calculateBrokerPerformanceFee(investmentAmount)}%`;
    
    // Inserir fatura
    const result = await client.query(
      `INSERT INTO invoices (user_id, invoice_number, amount, status, due_date, description)
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING *`,
      [userId, invoiceNumber, performanceFee, dueDate, invoiceDescription]
    );
    
    const invoice = result.rows[0];
    
    // Criar transação relacionada
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference)
       VALUES ($1, 'fee', $2, 'pending', $3, $4)`,
      [
        userId,
        performanceFee,
        `Performance Fee - Fatura ${invoiceNumber}`,
        invoice.id
      ]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Fatura criada com sucesso',
      invoice: {
        ...invoice,
        amount: parseFloat(invoice.amount)
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
 * @param {string} userId - ID do usuário
 * @param {Date} weekStart - Início da semana
 * @param {Date} weekEnd - Fim da semana
 * @returns {Promise<Object>} Resultado da geração
 */
async function generateWeeklyInvoices(userId, weekStart, weekEnd) {
  try {
    // Buscar investimentos ativos do usuário
    const investmentsResult = await pool.query(
      `SELECT id, amount, profit, current_value
       FROM user_investments
       WHERE user_id = $1 AND status = 'active'
       AND updated_at BETWEEN $2 AND $3`,
      [userId, weekStart, weekEnd]
    );
    
    if (investmentsResult.rows.length === 0) {
      return {
        success: true,
        message: 'Nenhum investimento ativo no período',
        invoices: []
      };
    }
    
    const invoices = [];
    
    for (const investment of investmentsResult.rows) {
      const profit = parseFloat(investment.profit) || 0;
      const amount = parseFloat(investment.amount) || 0;
      
      if (profit > 0) {
        const invoiceResult = await createPerformanceInvoice(
          userId,
          profit,
          amount,
          weekStart,
          weekEnd,
          `Performance Fee Semanal - Investimento ${investment.id}`
        );
        
        if (invoiceResult.success) {
          invoices.push(invoiceResult.invoice);
        }
      }
    }
    
    return {
      success: true,
      message: `${invoices.length} fatura(s) gerada(s)`,
      invoices
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
  createPerformanceInvoice,
  generateWeeklyInvoices,
  markInvoiceAsPaid,
  getPendingInvoices
};
