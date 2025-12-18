#!/bin/bash

# Script para executar migrações do banco de dados
# Uso: ./run-migrations.sh

echo "🚀 Iniciando migrações do banco de dados..."
echo ""

# Verificar se está usando Docker
if command -v docker-compose &> /dev/null; then
    echo "📦 Usando Docker Compose..."
    
    # Verificar se o container está rodando
    if ! docker-compose ps | grep -q "tradernex-db.*Up"; then
        echo "❌ Container do banco de dados não está rodando!"
        echo "   Execute: docker-compose up -d db"
        exit 1
    fi
    
    echo "✅ Container do banco de dados está rodando"
    echo ""
    
    # Executar migrações
    echo "📝 Executando migrações..."
    docker-compose exec -T db psql -U postgres -d tradernex << 'EOF'
-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Atualizar usuário admin (ajuste o email se necessário)
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'admin@tradernex.com';

-- Verificar resultados
SELECT 'Migração 1: Coluna is_admin' as status, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'is_admin'
       ) THEN '✅ OK' ELSE '❌ ERRO' END as resultado;

SELECT 'Migração 2: Coluna myfxbook_integration_login' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'mt4_accounts' AND column_name = 'myfxbook_integration_login'
       ) THEN '✅ OK' ELSE '❌ ERRO' END as resultado;

SELECT 'Migração 3: Usuário admin atualizado' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM users WHERE email = 'admin@tradernex.com' AND is_admin = TRUE
       ) THEN '✅ OK' ELSE '⚠️  Verifique se o email está correto' END as resultado;

SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE is_admin = TRUE;
EOF

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrações executadas com sucesso!"
        echo ""
        echo "📋 Próximos passos:"
        echo "   1. Reinicie o backend: docker-compose restart backend"
        echo "   2. Faça login com o usuário admin"
        echo "   3. Acesse /admin para testar o painel"
    else
        echo ""
        echo "❌ Erro ao executar migrações!"
        exit 1
    fi

else
    echo "❌ Docker Compose não encontrado!"
    echo "   Execute as migrações manualmente usando psql"
    echo "   Veja MIGRACOES.md para instruções detalhadas"
    exit 1
fi
