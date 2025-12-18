#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados estar pronto..."

# Função para verificar se o banco está pronto usando Node.js
wait_for_db() {
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    async function check() {
      try {
        await pool.query('SELECT 1');
        console.log('✅ Banco de dados está pronto!');
        process.exit(0);
      } catch (err) {
        // Mostra erro de autenticação claramente
        if (err.message && err.message.includes('password authentication failed')) {
          console.error('❌ ERRO DE AUTENTICAÇÃO: Senha incorreta para o usuário', process.env.DB_USER);
          console.error('   Verifique se DB_PASSWORD corresponde à senha do banco de dados');
          console.error('   Se o banco foi criado com outra senha, delete o volume ou ajuste a senha');
        } else {
          console.log('⏳ Banco de dados não está pronto ainda. Aguardando...');
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

# Aguarda o banco de dados estar disponível (máximo 60 tentativas = 2 minutos)
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if wait_for_db; then
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Timeout aguardando banco de dados após $MAX_ATTEMPTS tentativas"
  echo "   Verifique:"
  echo "   1. Se o container do banco está rodando"
  echo "   2. Se DB_USER, DB_PASSWORD e DB_NAME estão corretos"
  echo "   3. Se a senha corresponde à senha usada quando o banco foi criado"
  exit 1
fi

# Verifica se o banco precisa ser inicializado
echo "🔍 Verificando se o banco de dados precisa ser inicializado..."

TABLE_EXISTS=$(node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
pool.query(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')\")
  .then(result => {
    process.exit(result.rows[0].exists ? 0 : 1);
  })
  .catch(() => process.exit(1));
" 2>/dev/null || echo "1")

if [ "$TABLE_EXISTS" != "0" ]; then
  echo "🔄 Inicializando banco de dados..."
  node src/config/initDB.js || echo "⚠️  Erro ao inicializar banco (pode já estar inicializado)"
else
  echo "✅ Banco de dados já está inicializado"
fi

echo "🚀 Iniciando servidor..."
exec "$@"
