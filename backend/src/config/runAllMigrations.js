const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runAllMigrations() {
  // Usar conexão direta com multipleStatements
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tradernex',
    multipleStatements: true,
  });

  try {
    console.log('🔄 Executando todas as migrations pendentes...\n');

    // Como o schema.sql já inclui todas as tabelas e colunas,
    // as migrations do PostgreSQL não precisam ser re-executadas.
    // Apenas verificamos se as colunas/tabelas críticas existem.

    console.log('🔍 Verificando status das tabelas e colunas críticas...\n');

    const dbName = process.env.DB_NAME || 'tradernex';

    const checks = [
      {
        name: 'Coluna selected_plan_id',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'selected_plan_id'`
      },
      {
        name: 'Coluna profit_fee_percentage',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'investment_plans' AND COLUMN_NAME = 'profit_fee_percentage'`
      },
      {
        name: 'Tabela system_myfxbook_config',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'system_myfxbook_config'`
      },
      {
        name: 'Coluna is_admin',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'`
      },
      {
        name: 'Coluna encrypted_password (myfxbook_connections)',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'myfxbook_connections' AND COLUMN_NAME = 'encrypted_password'`
      },
      {
        name: 'Coluna credentials_status (mt4_accounts)',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'mt4_accounts' AND COLUMN_NAME = 'credentials_status'`
      },
      {
        name: 'Tabela crypto_interested',
        query: `SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'crypto_interested'`
      }
    ];

    let allOk = true;
    for (const check of checks) {
      try {
        const [rows] = await connection.query(check.query);
        if (rows.length > 0) {
          console.log(`✅ ${check.name}: OK`);
        } else {
          console.log(`❌ ${check.name}: FALTANDO`);
          allOk = false;
        }
      } catch (error) {
        console.log(`⚠️  ${check.name}: Erro ao verificar - ${error.message}`);
        allOk = false;
      }
    }

    if (allOk) {
      console.log('\n═══════════════════════════════════════════');
      console.log('   ✅ Todas as tabelas e colunas estão OK!');
      console.log('═══════════════════════════════════════════\n');
    } else {
      console.log('\n⚠️  Algumas colunas/tabelas estão faltando.');
      console.log('   Execute: node src/config/initDB.js para recriar o schema.\n');
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error.message);
    console.error(error);
    await connection.end();
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  runAllMigrations();
}

module.exports = runAllMigrations;
