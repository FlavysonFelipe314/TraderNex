const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runMigration() {
  try {
    console.log('🔄 Executando migração: Adicionar coluna encrypted_password...\n');

    // Ler o arquivo SQL de migração
    const migrationPath = path.join(__dirname, 'migrations', 'add_myfxbook_password_column.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Executar o SQL
    await pool.query(migrationSql);

    console.log('✅ Migração executada com sucesso!\n');
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Coluna encrypted_password adicionada!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    // Se a coluna já existir, não é um erro crítico
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate column'))) {
      console.log('ℹ️  Coluna encrypted_password já existe. Nenhuma ação necessária.\n');
      process.exit(0);
    }
    
    console.error('❌ Erro ao executar migração:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;



