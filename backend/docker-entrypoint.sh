#!/bin/sh
# set -e removido temporariamente para permitir verificação de tabelas
# Voltaremos a habilitar depois da inicialização do banco

echo "🔄 Aguardando PostgreSQL estar pronto..."

# Função para verificar se o PostgreSQL está pronto (conectando ao banco padrão 'postgres')
wait_for_postgres() {
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'postgres',  // Conecta ao banco padrão primeiro
    });
    
    async function check() {
      try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL está pronto!');
        process.exit(0);
      } catch (err) {
        if (err.message && err.message.includes('password authentication failed')) {
          console.error('❌ ERRO DE AUTENTICAÇÃO: Senha incorreta para o usuário', process.env.DB_USER);
          console.error('   Verifique se DB_PASSWORD corresponde à senha do banco de dados');
        } else {
          console.log('⏳ PostgreSQL não está pronto ainda. Aguardando...');
        }
        process.exit(1);
      } finally {
        await pool.end();
      }
    }
    check();
  " || return 1
  return 0
}

# Aguarda o PostgreSQL estar disponível (máximo 60 tentativas = 2 minutos)
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if wait_for_postgres; then
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Timeout aguardando PostgreSQL após $MAX_ATTEMPTS tentativas"
  echo "   Verifique:"
  echo "   1. Se o container do banco está rodando"
  echo "   2. Se DB_USER e DB_PASSWORD estão corretos"
  exit 1
fi

# Função para criar o banco de dados se não existir
echo "🔍 Verificando se o banco de dados '${DB_NAME:-tradernex}' existe..."
create_database() {
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'postgres',  // Conecta ao banco padrão para criar o banco
    });
    
    async function create() {
      try {
        const dbName = process.env.DB_NAME || 'tradernex';
        // Verifica se o banco existe
        const result = await pool.query(
          'SELECT 1 FROM pg_database WHERE datname = \$1',
          [dbName]
        );
        
        if (result.rows.length === 0) {
          console.log('📦 Criando banco de dados \"' + dbName + '\"...');
          await pool.query('CREATE DATABASE \"' + dbName + '\"');
          console.log('✅ Banco de dados criado com sucesso!');
        } else {
          console.log('✅ Banco de dados já existe');
        }
        process.exit(0);
      } catch (err) {
        console.error('❌ Erro ao verificar/criar banco de dados:', err.message);
        process.exit(1);
      } finally {
        await pool.end();
      }
    }
    create();
  "
}

if ! create_database; then
  echo "❌ Erro ao criar banco de dados"
  exit 1
fi

echo "✅ Banco de dados '${DB_NAME:-tradernex}' está disponível"

# Verifica se o banco precisa ser inicializado
echo "🔍 Verificando se o banco de dados precisa ser inicializado..."

check_tables() {
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'tradernex',
      connectionTimeoutMillis: 5000,
    });
    
    pool.query(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')\")
      .then(result => {
        const exists = result.rows[0].exists;
        pool.end();
        process.exit(exists ? 0 : 1);
      })
      .catch(err => {
        console.error('❌ Erro ao verificar tabelas:', err.message);
        pool.end().catch(() => {});
        process.exit(1);
      });
  " 2>&1
}

# Verifica tabelas com timeout implícito (sempre prossegue)
TABLE_CHECK_OUTPUT=$(check_tables 2>&1)
TABLE_EXISTS=$?

echo "📊 Código de saída da verificação de tabelas: $TABLE_EXISTS"

if [ "$TABLE_EXISTS" = "0" ]; then
  echo "✅ Banco de dados já está inicializado (tabela 'users' existe)"
else
  # Se houve erro ou tabelas não existem, tenta inicializar
  if echo "$TABLE_CHECK_OUTPUT" | grep -qi "Erro\|Error\|FATAL"; then
    echo "⚠️  Aviso ao verificar tabelas:"
    echo "$TABLE_CHECK_OUTPUT" | head -3
  fi
  
  echo "🔄 Tabelas não encontradas. Inicializando banco de dados..."
  
  INIT_OUTPUT=$(node src/config/initDB.js 2>&1)
  INIT_EXIT_CODE=$?
  
  echo "$INIT_OUTPUT"
  
  if [ "$INIT_EXIT_CODE" != "0" ]; then
    echo ""
    echo "❌ ERRO: Inicialização do banco de dados falhou com código $INIT_EXIT_CODE"
    echo "   Verificando se as tabelas foram criadas mesmo assim..."
    
    # Verifica novamente se as tabelas existem
    TABLE_CHECK_AFTER=$(check_tables 2>&1)
    TABLE_EXISTS_AFTER=$?
    
    if [ "$TABLE_EXISTS_AFTER" = "0" ]; then
      echo "✅ As tabelas foram criadas apesar do erro acima"
      echo "   Continuando com o servidor..."
    else
      echo "❌ CRÍTICO: As tabelas AINDA não existem após tentativa de inicialização!"
      echo "   O servidor não pode funcionar sem as tabelas do banco de dados."
      echo "   Por favor, verifique os erros acima e tente novamente."
      echo ""
      echo "   Para inicializar manualmente, execute:"
      echo "   docker-compose exec backend node src/config/initDB.js"
      exit 1
    fi
  else
    echo "✅ Inicialização concluída com sucesso!"
  fi
fi

echo ""
echo "════════════════════════════════════════════"
echo "🚀 Iniciando servidor Node.js..."
echo "════════════════════════════════════════════"
echo ""

# Habilita exit on error para o resto do script
set -e

# Inicia o servidor
exec "$@"
