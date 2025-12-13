#!/bin/bash

# ============================================================================
# TraderNex - Script de Setup Automatizado
# ============================================================================
# 
# Este script ajuda a configurar o projeto rapidamente.
# Execute: bash setup.sh
#
# ============================================================================

echo "🚀 TraderNex - Setup Automatizado"
echo "=================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    echo ""
    echo "Por favor, preencha as variáveis de ambiente:"
    echo "Veja ENV-TEMPLATE.md para referência"
    echo ""
    
    # Criar .env básico
    cat > .env << EOF
# TraderNex - Variáveis de Ambiente
# Preencha com suas credenciais

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=tradernex

JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "sua_chave_secreta_jwt_forte_aqui")
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
EOF
    
    echo "✅ Arquivo .env criado!"
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais antes de continuar"
    echo ""
    read -p "Pressione Enter após editar o .env para continuar..."
else
    echo "✅ Arquivo .env já existe"
    echo ""
fi

# Construir e iniciar containers
echo "🔨 Construindo containers..."
docker-compose build

echo ""
echo "🚀 Iniciando containers..."
docker-compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Inicializar banco de dados
echo ""
echo "🗄️  Inicializando banco de dados..."
docker-compose exec -T backend npm run init-db

echo ""
echo "🌱 Populando banco com dados iniciais..."
docker-compose exec -T backend npm run seed

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📡 Acessos:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Swagger:  http://localhost:5000/api-docs"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs:        docker-compose logs -f"
echo "   Parar:           docker-compose down"
echo "   Reiniciar:       docker-compose restart"
echo ""
