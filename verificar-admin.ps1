# Script para verificar e resolver problema do /admin
Write-Host "🔍 Verificando configuração do painel admin..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o arquivo AdminPage.jsx existe
Write-Host "1. Verificando arquivo AdminPage.jsx..." -ForegroundColor Yellow
if (Test-Path "frontend\src\page\AdminPage.jsx") {
    Write-Host "   ✅ Arquivo AdminPage.jsx existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ Arquivo AdminPage.jsx NÃO existe!" -ForegroundColor Red
    Write-Host "   Crie o arquivo em: frontend\src\page\AdminPage.jsx" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar se a rota está no App.jsx
Write-Host "2. Verificando rota no App.jsx..." -ForegroundColor Yellow
$appContent = Get-Content "frontend\src\App.jsx" -Raw
if ($appContent -match "AdminPage" -and $appContent -match "/admin") {
    Write-Host "   ✅ Rota /admin configurada no App.jsx" -ForegroundColor Green
} else {
    Write-Host "   ❌ Rota /admin NÃO encontrada no App.jsx!" -ForegroundColor Red
    Write-Host "   Adicione a rota no arquivo App.jsx" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar se o frontend está rodando
Write-Host "3. Verificando se o frontend está rodando..." -ForegroundColor Yellow
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $frontendStatus = docker-compose ps frontend 2>&1 | Select-String "Up"
    if ($frontendStatus) {
        Write-Host "   ✅ Frontend está rodando (Docker)" -ForegroundColor Green
        
        # Verificar porta
        $port = docker-compose ps frontend | Select-String "0.0.0.0:(\d+)->80" | ForEach-Object { $_.Matches.Groups[1].Value }
        if ($port) {
            Write-Host "   📍 Porta mapeada: $port" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ⚠️  Frontend NÃO está rodando!" -ForegroundColor Yellow
        Write-Host "   Execute: docker-compose up -d frontend" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Docker Compose não encontrado" -ForegroundColor Yellow
    Write-Host "   Verifique se o frontend está rodando manualmente" -ForegroundColor Yellow
}

# 4. Verificar se o backend está rodando
Write-Host "4. Verificando se o backend está rodando..." -ForegroundColor Yellow
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $backendStatus = docker-compose ps backend 2>&1 | Select-String "Up"
    if ($backendStatus) {
        Write-Host "   ✅ Backend está rodando" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend NÃO está rodando!" -ForegroundColor Yellow
        Write-Host "   Execute: docker-compose up -d backend" -ForegroundColor Yellow
    }
}

# 5. Verificar se o serviço adminService existe
Write-Host "5. Verificando serviço adminService..." -ForegroundColor Yellow
if (Test-Path "frontend\src\services\adminService.js") {
    Write-Host "   ✅ adminService.js existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ adminService.js NÃO existe!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Certifique-se de que o frontend está rodando" -ForegroundColor Yellow
Write-Host "   2. Acesse: http://localhost:3000/admin (ou a porta correta)" -ForegroundColor Yellow
Write-Host "   3. Certifique-se de estar logado como admin" -ForegroundColor Yellow
Write-Host "   4. Limpe o cache do navegador (Ctrl + Shift + R)" -ForegroundColor Yellow
Write-Host ""

# Sugerir reiniciar
Write-Host "💡 Para reiniciar tudo:" -ForegroundColor Cyan
Write-Host "   docker-compose restart frontend" -ForegroundColor Yellow
Write-Host ""
