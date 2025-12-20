const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration: add_referral_commission_details...');
    
    await client.query('BEGIN');
    
    // Ler arquivo SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add_referral_commission_details.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar migration
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Campos adicionados à tabela referrals:');
    console.log('   - investment_amount');
    console.log('   - profit_amount');
    console.log('   - broker_fee_percentage');
    console.log('   - broker_profit');
    console.log('   - last_commission_date');
    console.log('   - updated_at');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Processo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
