# ============================================================================
# TraderNex Frontend - Dockerfile de Produção (Multi-stage)
# ============================================================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copie os arquivos de definição de dependências
COPY package*.json ./

# Instale todas as dependências (incluindo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copie o código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Instale wget para o healthcheck (nginx:alpine pode não ter por padrão em algumas versões)
RUN apk add --no-cache wget

# Copie a configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie os arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponha a porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --spider --quiet http://localhost/ || exit 1

# Nginx já inicia automaticamente, mas podemos especificar explicitamente
CMD ["nginx", "-g", "daemon off;"]

