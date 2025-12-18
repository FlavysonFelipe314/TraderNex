# Script simples para verificar admin
Write-Host "Verificando configuracao do painel admin..." -ForegroundColor Cyan
Write-Host ""

# Verificar arquivo
if (Test-Path "frontend\src\page\AdminPage.jsx") {
    Write-Host "OK: Arquivo AdminPage.jsx existe" -ForegroundColor Green
} else {
    Write-Host "ERRO: Arquivo AdminPage.jsx NAO existe!" -ForegroundColor Red
}

# Verificar rota
$appContent = Get-Content "frontend\src\App.jsx" -Raw
if ($appContent -match "AdminPage" -and $appContent -match "/admin") {
    Write-Host "OK: Rota /admin configurada" -ForegroundColor Green
} else {
    Write-Host "ERRO: Rota /admin NAO encontrada!" -ForegroundColor Red
}

# Verificar Docker
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $frontend = docker-compose ps frontend 2>&1 | Select-String "Up"
    if ($frontend) {
        Write-Host "OK: Frontend rodando" -ForegroundColor Green
    } else {
        Write-Host "AVISO: Frontend NAO esta rodando" -ForegroundColor Yellow
        Write-Host "Execute: docker-compose up -d frontend" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Acesse: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "Ou reinicie: docker-compose restart frontend" -ForegroundColor Yellow

