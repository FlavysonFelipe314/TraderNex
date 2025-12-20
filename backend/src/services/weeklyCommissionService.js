const pool = require('../config/database');
const { processReferralCommission } = require('./referralCommissionService');
const { generateWeeklyInvoices } = require('./invoiceService');

/**
 * Processa comissões semanais para todos os usuários
 * Executa toda sexta-feira baseado nos lucros da semana
 */
async function processWeeklyCommissions() {
  try {
    console.log('[WeeklyCommissions] Iniciando processamento semanal de comissões...');
    
    // Calcular início e fim da semana (segunda a sexta)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 5 = sexta
    
    // Se não for sexta-feira, ajustar para a última sexta-feira
    let weekEnd = new Date(now);
    if (dayOfWeek !== 5) {
      const daysToSubtract = dayOfWeek < 5 ? dayOfWeek + 2 : dayOfWeek - 5;
      weekEnd.setDate(now.getDate() - daysToSubtract);
    }
    weekEnd.setHours(23, 59, 59, 999);
    
    // Início da semana (segunda-feira)
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 4); // 4 dias antes (segunda)
    weekStart.setHours(0, 0, 0, 0);
    
    console.log(`[WeeklyCommissions] Período: ${weekStart.toISOString()} a ${weekEnd.toISOString()}`);
    
    // Buscar todos os usuários com investimentos ativos ou contas MT4
    const usersResult = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
       FROM users u
       WHERE u.is_active = TRUE AND u.is_admin = FALSE
       AND (
         EXISTS (SELECT 1 FROM user_investments ui WHERE ui.user_id = u.id AND ui.status = 'active')
         OR EXISTS (SELECT 1 FROM mt4_accounts mt4 WHERE mt4.user_id = u.id AND mt4.status = 'active')
       )`
    );
    
    const users = usersResult.rows;
    console.log(`[WeeklyCommissions] Encontrados ${users.length} usuários para processar`);
    
    const results = {
      processed: 0,
      commissions: 0,
      invoices: 0,
      errors: []
    };
    
    for (const user of users) {
      try {
        // Processar investimentos ativos
        // Buscar investimentos que não foram processados esta semana OU que têm lucro novo
        const investmentsResult = await pool.query(
          `SELECT id, amount, profit, current_value, 
                  COALESCE(last_weekly_profit, 0) as last_weekly_profit,
                  last_weekly_processed_date
           FROM user_investments
           WHERE user_id = $1 AND status = 'active'
           AND profit > 0
           AND (
             last_weekly_processed_date IS NULL 
             OR last_weekly_processed_date < $2
             OR profit > COALESCE(last_weekly_profit, 0)
           )`,
          [user.id, weekStart]
        );
        
        for (const investment of investmentsResult.rows) {
          const currentProfit = parseFloat(investment.profit) || 0;
          const lastWeeklyProfit = parseFloat(investment.last_weekly_profit) || 0;
          const profitDifference = currentProfit - lastWeeklyProfit;
          const amount = parseFloat(investment.amount) || 0;
          
          // Só processar se houver lucro novo desde a última semana
          if (profitDifference > 0) {
            // Processar comissão de indicação (usar apenas o lucro novo da semana)
            try {
              const commissionResult = await processReferralCommission(
                user.id,
                profitDifference, // Apenas o lucro novo da semana
                amount,
                investment.id
              );
              
              if (commissionResult.success && commissionResult.commission) {
                results.commissions++;
                console.log(`[WeeklyCommissions] Comissão processada para usuário ${user.id}: ${commissionResult.commission.amount}`);
              }
            } catch (commError) {
              console.error(`[WeeklyCommissions] Erro ao processar comissão para investimento ${investment.id}:`, commError);
              results.errors.push({
                type: 'commission',
                userId: user.id,
                investmentId: investment.id,
                error: commError.message
              });
            }
            
            // Atualizar lucro processado na última semana
            await pool.query(
              `UPDATE user_investments
               SET last_weekly_profit = $1,
                   last_weekly_processed_date = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [currentProfit, investment.id]
            );
          }
        }
        
        // Gerar fatura semanal agrupada (uma fatura por semana baseada no plano)
        try {
          const invoiceResult = await generateWeeklyInvoices(user.id, weekStart, weekEnd);
          if (invoiceResult.success && invoiceResult.invoices && invoiceResult.invoices.length > 0) {
            results.invoices += invoiceResult.invoices.length;
            console.log(`[WeeklyCommissions] Fatura semanal gerada para usuário ${user.id}`);
          }
        } catch (invoiceError) {
          console.error(`[WeeklyCommissions] Erro ao gerar fatura semanal para usuário ${user.id}:`, invoiceError);
          results.errors.push({
            type: 'invoice',
            userId: user.id,
            error: invoiceError.message
          });
        }
        
        // Processar contas MT4 (se houver dados do MyFXBook)
        // Aqui você pode integrar com dados do MyFXBook para calcular lucros semanais
        // Por enquanto, vamos processar apenas investimentos
        
        results.processed++;
      } catch (userError) {
        console.error(`[WeeklyCommissions] Erro ao processar usuário ${user.id}:`, userError);
        results.errors.push({
          type: 'user',
          userId: user.id,
          error: userError.message
        });
      }
    }
    
    console.log('[WeeklyCommissions] Processamento concluído:', results);
    
    return {
      success: true,
      message: 'Comissões semanais processadas',
      results
    };
  } catch (error) {
    console.error('[WeeklyCommissions] Erro fatal:', error);
    throw error;
  }
}

/**
 * Endpoint para processar comissões semanais manualmente (admin)
 */
async function processWeeklyCommissionsManual() {
  try {
    const result = await processWeeklyCommissions();
    return result;
  } catch (error) {
    console.error('Erro ao processar comissões semanais:', error);
    throw error;
  }
}

module.exports = {
  processWeeklyCommissions,
  processWeeklyCommissionsManual
};
