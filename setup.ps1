# ============================================================================
# TraderNex - Script de Setup Automatizado (PowerShell)
# ============================================================================
# 
# Este script ajuda a configurar o projeto rapidamente no Windows.
# Execute: .\setup.ps1
#
# ============================================================================

Write-Host "🚀 TraderNex - Setup Automatizado" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não está instalado. Por favor, instale o Docker primeiro." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker e Docker Compose encontrados" -ForegroundColor Green
Write-Host ""

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, preencha as variáveis de ambiente:" -ForegroundColor Yellow
    Write-Host "Veja ENV-TEMPLATE.md para referência" -ForegroundColor Yellow
    Write-Host ""
    
    # Criar .env básico
    $envContent = @"
# TraderNex - Variáveis de Ambiente
# Preencha com suas credenciais

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=tradernex

JWT_SECRET=sua_chave_secreta_jwt_forte_aqui
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=TraderNex <noreply@tradernex.com>

PORT=5000
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais antes de continuar" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter após editar o .env para continuar"
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
    Write-Host ""
}

# Construir e iniciar containers
Write-Host "🔨 Construindo containers..." -ForegroundColor Cyan
docker-compose build

Write-Host ""
Write-Host "🚀 Iniciando containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Inicializar banco de dados
Write-Host ""
Write-Host "🗄️  Inicializando banco de dados..." -ForegroundColor Cyan
docker-compose exec -T backend npm run init-db

Write-Host ""
Write-Host "🌱 Populando banco com dados iniciais..." -ForegroundColor Cyan
docker-compose exec -T backend npm run seed

Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Acessos:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend:  http://localhost:5000"
Write-Host "   Swagger:  http://localhost:5000/api-docs"
Write-Host ""
Write-Host "📋 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs:        docker-compose logs -f"
Write-Host "   Parar:           docker-compose down"
Write-Host "   Reiniciar:       docker-compose restart"
Write-Host ""
