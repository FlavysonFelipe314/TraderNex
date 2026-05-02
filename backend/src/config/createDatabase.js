/**
 * Script para criar o banco de dados tradernex se não existir (MySQL)
 * 
 * Este script conecta ao MySQL e cria o banco de dados 'tradernex' se ele não existir.
 * 
 * Uso:
 *   node src/config/createDatabase.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'tradernex';
  
  // Conecta sem especificar banco de dados
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log(`🔍 Verificando se o banco de dados '${dbName}' existe...`);

    // Verifica se o banco existe
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    if (rows.length === 0) {
      console.log(`📦 Criando banco de dados '${dbName}'...`);
      
      // Cria o banco de dados com charset UTF-8
      await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      
      console.log(`✅ Banco de dados '${dbName}' criado com sucesso!`);
    } else {
      console.log(`✅ Banco de dados '${dbName}' já existe.`);
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error.message);
    console.error(error);
    await connection.end();
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;
