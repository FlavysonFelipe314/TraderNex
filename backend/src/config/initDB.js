const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function initializeDatabase() {
  try {
    console.log('🔄 Iniciando criação do schema do banco de dados...\n');

    // Ler o arquivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Executar o SQL
    await pool.query(schemaSql);

    console.log('✅ Schema do banco de dados criado com sucesso!\n');

    // Inserir dados iniciais de planos de investimento
    console.log('🔄 Inserindo dados iniciais...\n');

    await pool.query(`
      INSERT INTO investment_plans (name, description, min_investment, max_investment, expected_return, duration_days, risk_level)
      VALUES
        ('Plano Starter', 'Ideal para iniciantes que querem experimentar o trading automatizado.', 100, 1000, 5.0, 30, 'Low'),
        ('Plano Professional', 'Para investidores experientes buscando retornos consistentes.', 1000, 10000, 12.0, 60, 'Medium'),
        ('Plano Premium', 'Estratégias avançadas de IA com alto potencial de retorno.', 10000, 50000, 20.0, 90, 'High'),
        ('Plano Elite', 'Gerenciamento exclusivo com acesso a estratégias premium de IA.', 50000, NULL, 30.0, 180, 'High')
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Dados iniciais inseridos com sucesso!\n');
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Banco de dados configurado!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
