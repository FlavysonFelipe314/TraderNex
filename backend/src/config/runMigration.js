const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runMigration() {
  try {
    console.log('🔄 Executando migração: Adicionar tabela myfxbook_connections...\n');

    // Ler o arquivo SQL de migração
    const migrationPath = path.join(__dirname, 'migrations', 'add_myfxbook_table.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Executar o SQL
    await pool.query(migrationSql);

    console.log('✅ Migração executada com sucesso!\n');
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Tabela myfxbook_connections criada!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    // Se a tabela já existir, não é um erro crítico
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Tabela myfxbook_connections já existe. Nenhuma ação necessária.\n');
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

