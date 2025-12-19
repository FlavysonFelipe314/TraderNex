const pool = require('./database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🔄 Aplicando migration: add_selected_plan_id...\n');
    
    // Verificar conexão com o banco
    console.log('🔍 Verificando conexão com o banco de dados...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME || 'tradernex'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}\n`);

    // Testar conexão
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco de dados estabelecida!\n');

    // Verificar se a tabela client_profiles existe
    console.log('🔍 Verificando se a tabela client_profiles existe...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_profiles'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ ERRO: A tabela client_profiles não existe no banco de dados!');
      console.error('   Execute primeiro: npm run init-db\n');
      process.exit(1);
    }
    console.log('✅ Tabela client_profiles encontrada!\n');

    // Verificar se a coluna já existe
    console.log('🔍 Verificando se a coluna selected_plan_id já existe...');
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'client_profiles' 
      AND column_name = 'selected_plan_id'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('ℹ️  Coluna selected_plan_id já existe. Nada a fazer.\n');
      process.exit(0);
    }
    console.log('✅ Coluna não existe. Prosseguindo com a migration...\n');

    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_selected_plan_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executar a migration
    console.log('🔄 Executando migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('   - Coluna selected_plan_id adicionada em client_profiles');
    console.log('   - Índice criado para melhor performance\n');

    // Verificar se foi aplicada corretamente
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'client_profiles' 
      AND column_name = 'selected_plan_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Verificação: Coluna existe no banco de dados!');
      console.log(`   Tipo: ${checkResult.rows[0].data_type}\n`);
    } else {
      console.log('⚠️  Aviso: Coluna não encontrada após a migration\n');
    }

    process.exit(0);
  } catch (error) {
    // Se a coluna já existe, não é um erro crítico
    if (error.message && (
      error.message.includes('already exists') || 
      error.message.includes('duplicate column')
    )) {
      console.log('ℹ️  Coluna já existe no banco de dados. Nada a fazer.\n');
      process.exit(0);
    }

    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalhes:', error.detail || 'N/A');
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;

