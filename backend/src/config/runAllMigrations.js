const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runAllMigrations() {
  try {
    console.log('🔄 Executando todas as migrations pendentes...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Executar em ordem alfabética

    console.log(`📋 Encontradas ${migrationFiles.length} migrations:\n`);

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationName = file.replace('.sql', '');
      
      try {
        console.log(`🔄 Executando: ${migrationName}...`);
        
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSql);
        
        console.log(`✅ ${migrationName} - OK\n`);
      } catch (error) {
        // Se for erro de "já existe", não é crítico
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('column') && error.message.includes('already exists')
        )) {
          console.log(`ℹ️  ${migrationName} - Já aplicada (pode ser ignorado)\n`);
        } else {
          console.error(`❌ ${migrationName} - ERRO:`, error.message);
          console.error(`   Continuando com próxima migration...\n`);
          // Não interrompe, continua com as próximas
        }
      }
    }

    // Aplicar migrations específicas que podem estar faltando
    console.log('🔄 Aplicando migrations críticas adicionais...\n');

    const criticalMigrations = [
      {
        name: 'selected_plan_id',
        sql: `
          ALTER TABLE client_profiles 
          ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES investment_plans(id);
          CREATE INDEX IF NOT EXISTS idx_client_profiles_selected_plan_id ON client_profiles(selected_plan_id);
        `
      },
      {
        name: 'system_myfxbook_config',
        sql: `
          CREATE TABLE IF NOT EXISTS system_myfxbook_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            encrypted_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id)
          );
        `
      }
    ];

    for (const migration of criticalMigrations) {
      try {
        await pool.query(migration.sql);
        console.log(`✅ ${migration.name} - OK\n`);
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`ℹ️  ${migration.name} - Já aplicada\n`);
        } else {
          console.error(`⚠️  ${migration.name} - Aviso:`, error.message);
        }
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Todas as migrations executadas!');
    console.log('═══════════════════════════════════════════\n');

    // Verificar status das migrations críticas
    console.log('🔍 Verificando status das migrations críticas...\n');

    const checks = [
      {
        name: 'Coluna selected_plan_id',
        query: `SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'client_profiles' AND column_name = 'selected_plan_id'`
      },
      {
        name: 'Tabela system_myfxbook_config',
        query: `SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'system_myfxbook_config'`
      },
      {
        name: 'Coluna is_admin',
        query: `SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_admin'`
      }
    ];

    for (const check of checks) {
      try {
        const result = await pool.query(check.query);
        if (result.rows.length > 0) {
          console.log(`✅ ${check.name}: OK`);
        } else {
          console.log(`❌ ${check.name}: FALTANDO`);
        }
      } catch (error) {
        console.log(`⚠️  ${check.name}: Erro ao verificar - ${error.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
  runAllMigrations();
}

module.exports = runAllMigrations;


