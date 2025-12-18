# Script PowerShell para executar migrações do banco de dados
# Uso: .\run-migrations.ps1

Write-Host "🚀 Iniciando migrações do banco de dados..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está usando Docker
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "📦 Usando Docker Compose..." -ForegroundColor Yellow
    
    # Verificar se o container está rodando
    $dbStatus = docker-compose ps | Select-String "tradernex-db.*Up"
    if (-not $dbStatus) {
        Write-Host "❌ Container do banco de dados não está rodando!" -ForegroundColor Red
        Write-Host "   Execute: docker-compose up -d db" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Container do banco de dados está rodando" -ForegroundColor Green
    Write-Host ""
    
    # Executar migrações
    Write-Host "📝 Executando migrações..." -ForegroundColor Yellow
    
    $sqlCommands = @"
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

-- 4. Adicionar colunas de configurações operacionais MT4
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));

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

SELECT 'Migração 4: Coluna automation_enabled' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'mt4_accounts' AND column_name = 'automation_enabled'
       ) THEN '✅ OK' ELSE '❌ ERRO' END as resultado;

SELECT 'Migração 5: Coluna risk_profile' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'mt4_accounts' AND column_name = 'risk_profile'
       ) THEN '✅ OK' ELSE '❌ ERRO' END as resultado;

SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE is_admin = TRUE;
"@

    $sqlCommands | docker-compose exec -T db psql -U postgres -d tradernex

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrações executadas com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Reinicie o backend: docker-compose restart backend" -ForegroundColor Yellow
        Write-Host "   2. Faça login com o usuário admin" -ForegroundColor Yellow
        Write-Host "   3. Acesse /admin para testar o painel" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar migrações!" -ForegroundColor Red
        exit 1
    }

} else {
    Write-Host "❌ Docker Compose não encontrado!" -ForegroundColor Red
    Write-Host "   Execute as migrações manualmente usando psql" -ForegroundColor Yellow
    Write-Host "   Veja MIGRACOES.md para instruções detalhadas" -ForegroundColor Yellow
    exit 1
}
