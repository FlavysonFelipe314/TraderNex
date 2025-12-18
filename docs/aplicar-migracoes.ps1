# Script para aplicar migrations do banco de dados
# TraderNex - Aplicar Migrations

Write-Host ""
Write-Host "🚀 Aplicando Migrations do TraderNex" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo existe
if (-Not (Test-Path "MIGRACOES-SIMPLES.sql")) {
    Write-Host "❌ Erro: Arquivo MIGRACOES-SIMPLES.sql não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verificar se os containers estão rodando
Write-Host "📋 Verificando containers..." -ForegroundColor Yellow
$dbStatus = docker-compose ps db 2>&1
if ($LASTEXITCODE -ne 0 -or $dbStatus -match "Exit|Stopped") {
    Write-Host "⚠️  Container do banco de dados não está rodando!" -ForegroundColor Yellow
    Write-Host "   Iniciando containers..." -ForegroundColor Yellow
    docker-compose up -d db
    Start-Sleep -Seconds 5
}

# Verificar se o banco de dados existe
Write-Host ""
Write-Host "🔍 Verificando banco de dados 'tradernex'..." -ForegroundColor Yellow
$dbCheck = docker-compose exec -T db psql -U postgres -lqt 2>&1 | Select-String "tradernex"
if (-Not $dbCheck) {
    Write-Host "⚠️  Banco de dados 'tradernex' não encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando banco de dados..." -ForegroundColor Yellow
    docker-compose exec -T db psql -U postgres -c "CREATE DATABASE tradernex;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Banco de dados criado!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao criar banco de dados!" -ForegroundColor Red
        exit 1
    }
}

# Aplicar migrations
Write-Host ""
Write-Host "📝 Aplicando migrations..." -ForegroundColor Cyan
Write-Host ""

$output = Get-Content MIGRACOES-SIMPLES.sql | docker-compose exec -T db psql -U postgres -d tradernex 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations aplicadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    # Verificações opcionais
    Write-Host "🔍 Verificando resultados..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar coluna is_admin
    Write-Host "   Verificando coluna 'is_admin'..." -ForegroundColor Gray
    $check1 = docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';" 2>&1
    if ($check1 -match "is_admin") {
        Write-Host "   ✅ Coluna 'is_admin' encontrada!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Coluna 'is_admin' não encontrada" -ForegroundColor Yellow
    }
    
    # Verificar colunas mt4_accounts
    Write-Host "   Verificando colunas 'mt4_accounts'..." -ForegroundColor Gray
    $check2 = docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'mt4_accounts' AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');" 2>&1
    if ($check2 -match "myfxbook_integration_login|automation_enabled|risk_profile") {
        Write-Host "   ✅ Colunas de 'mt4_accounts' encontradas!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Algumas colunas podem não ter sido criadas" -ForegroundColor Yellow
    }
    
    # Verificar usuário admin
    Write-Host "   Verificando usuário admin..." -ForegroundColor Gray
    $check3 = docker-compose exec -T db psql -U postgres -d tradernex -c "SELECT email, is_admin FROM users WHERE is_admin = TRUE;" 2>&1
    if ($check3 -match "admin@tradernex.com") {
        Write-Host "   ✅ Usuário admin configurado!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Usuário admin não encontrado (pode não existir ainda)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✨ Migrations concluídas!" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Erro ao aplicar migrations!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Saída do erro:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dica: Verifique se:" -ForegroundColor Yellow
    Write-Host "   - Os containers estão rodando (docker-compose ps)" -ForegroundColor Gray
    Write-Host "   - O banco de dados existe" -ForegroundColor Gray
    Write-Host "   - As credenciais no .env estão corretas" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

