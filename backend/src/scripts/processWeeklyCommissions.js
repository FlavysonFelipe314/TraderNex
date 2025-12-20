/**
 * Script para processar comissões semanais
 * Executar manualmente ou via cron job toda sexta-feira
 * 
 * Uso:
 *   node backend/src/scripts/processWeeklyCommissions.js
 */

require('dotenv').config();
const { processWeeklyCommissions } = require('../services/weeklyCommissionService');

async function main() {
  try {
    console.log('🚀 Iniciando processamento de comissões semanais...\n');
    
    const result = await processWeeklyCommissions();
    
    if (result.success) {
      console.log('\n✅ Processamento concluído com sucesso!');
      console.log(`📊 Estatísticas:`);
      console.log(`   - Usuários processados: ${result.results.processed}`);
      console.log(`   - Comissões calculadas: ${result.results.commissions}`);
      console.log(`   - Faturas criadas: ${result.results.invoices}`);
      
      if (result.results.errors.length > 0) {
        console.log(`\n⚠️  Erros encontrados: ${result.results.errors.length}`);
        result.results.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.type} - Usuário ${error.userId}: ${error.error}`);
        });
      }
      
      process.exit(0);
    } else {
      console.error('\n❌ Erro no processamento:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = main;
