# Script completo para executar todas as migrações
Write-Host "Executando todas as migracoes..." -ForegroundColor Cyan
Write-Host ""

$sql = @"
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
"@

Write-Host "Executando SQL..." -ForegroundColor Yellow
$sql | docker-compose exec -T db psql -U postgres -d tradernex

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Verificando resultados..." -ForegroundColor Yellow
    
    Write-Host "`n1. Verificando coluna is_admin:" -ForegroundColor Cyan
    docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';"
    
    Write-Host "`n2. Verificando colunas mt4_accounts:" -ForegroundColor Cyan
    docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'mt4_accounts' AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');"
    
    Write-Host "`n3. Verificando usuario admin:" -ForegroundColor Cyan
    docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT email, is_admin FROM users WHERE is_admin = TRUE;"
    
    Write-Host ""
    Write-Host "Migracoes concluidas!" -ForegroundColor Green
    Write-Host "Reinicie o backend: docker-compose restart backend" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Erro ao executar migracoes!" -ForegroundColor Red
}
