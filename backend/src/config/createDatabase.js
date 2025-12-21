/**
 * Script para criar o banco de dados tradernex se não existir
 * 
 * Este script conecta ao PostgreSQL usando o banco padrão 'postgres'
 * e cria o banco de dados 'tradernex' se ele não existir.
 * 
 * Uso:
 *   node src/config/createDatabase.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'tradernex';
  
  // Primeiro, conecta ao banco padrão 'postgres' para poder criar o banco
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',  // Conecta ao banco padrão
  });

  try {
    console.log(`🔍 Verificando se o banco de dados '${dbName}' existe...`);

    // Verifica se o banco existe
    const checkResult = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`📦 Criando banco de dados '${dbName}'...`);
      
      // Cria o banco de dados
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      
      console.log(`✅ Banco de dados '${dbName}' criado com sucesso!`);
    } else {
      console.log(`✅ Banco de dados '${dbName}' já existe.`);
    }

    await adminPool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error.message);
    console.error(error);
    await adminPool.end();
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;
