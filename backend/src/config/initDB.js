const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  // Usar conexão direta com multipleStatements para executar o schema completo
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tradernex',
    multipleStatements: true,
  });

  try {
    console.log('🔄 Iniciando criação do schema do banco de dados...\n');

    // Ler o arquivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Executar o SQL (suporta múltiplas statements)
    await connection.query(schemaSql);

    console.log('✅ Schema do banco de dados criado com sucesso!\n');

    // Inserir dados iniciais de planos de investimento
    console.log('🔄 Inserindo dados iniciais...\n');

    // Usar INSERT IGNORE para evitar duplicatas
    await connection.query(`
      INSERT IGNORE INTO investment_plans (id, name, description, min_investment, max_investment, expected_return, duration_days, risk_level)
      VALUES
        (UUID(), 'Plano Starter', 'Ideal para iniciantes que querem experimentar o trading automatizado.', 100, 1000, 5.0, 30, 'Low'),
        (UUID(), 'Plano Professional', 'Para investidores experientes buscando retornos consistentes.', 1000, 10000, 12.0, 60, 'Medium'),
        (UUID(), 'Plano Premium', 'Estratégias avançadas de IA com alto potencial de retorno.', 10000, 50000, 20.0, 90, 'High'),
        (UUID(), 'Plano Elite', 'Gerenciamento exclusivo com acesso a estratégias premium de IA.', 50000, NULL, 30.0, 180, 'High');
    `);

    console.log('✅ Dados iniciais inseridos com sucesso!\n');
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Banco de dados configurado!');
    console.log('═══════════════════════════════════════════\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    console.error(error);
    await connection.end();
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
