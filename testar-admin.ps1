# Script para testar acesso ao admin
Write-Host "Testando acesso ao painel admin..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está logado
Write-Host "1. Verificando autenticacao..." -ForegroundColor Yellow
Write-Host "   Acesse: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   Faca login com um usuario admin" -ForegroundColor Cyan
Write-Host ""

# Verificar se é admin
Write-Host "2. Verificando se o usuario e admin..." -ForegroundColor Yellow
Write-Host "   Execute no banco:" -ForegroundColor Cyan
Write-Host "   docker-compose exec db psql -U postgres -d tradernex -c ""SELECT email, is_admin FROM users WHERE email = 'admin@tradernex.com';""" -ForegroundColor Yellow
Write-Host ""

# Verificar frontend
Write-Host "3. Verificando frontend..." -ForegroundColor Yellow
$frontend = docker-compose ps frontend 2>&1 | Select-String "Up"
if ($frontend) {
    Write-Host "   OK: Frontend rodando" -ForegroundColor Green
    
    # Verificar modo
    $logs = docker-compose logs frontend --tail=10 2>&1
    if ($logs -match "VITE" -or $logs -match "vite") {
        Write-Host "   Modo: DESENVOLVIMENTO (Vite)" -ForegroundColor Cyan
        Write-Host "   Acesse: http://localhost:3000/admin" -ForegroundColor Green
    } elseif ($logs -match "nginx") {
        Write-Host "   Modo: PRODUCAO (Nginx)" -ForegroundColor Cyan
        Write-Host "   Acesse: http://localhost:3000/admin" -ForegroundColor Green
        Write-Host "   AVISO: Se der 404, pode precisar rebuild:" -ForegroundColor Yellow
        Write-Host "   docker-compose up -d --build frontend" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERRO: Frontend nao esta rodando!" -ForegroundColor Red
    Write-Host "   Execute: docker-compose up -d frontend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Teste manual:" -ForegroundColor Yellow
Write-Host "   a) Faca login em: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   b) Acesse: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "   c) Se der 404, pressione Ctrl+Shift+R para limpar cache" -ForegroundColor Cyan
Write-Host "   d) Verifique o console do navegador (F12) para erros" -ForegroundColor Cyan
Write-Host ""

# Sugerir rebuild
Write-Host "5. Se ainda nao funcionar, reconstrua:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Yellow
Write-Host "   docker-compose up -d --build" -ForegroundColor Yellow
Write-Host ""
