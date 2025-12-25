# ============================================================================
# TraderNex Backend - Dockerfile de Produção
# ============================================================================
FROM node:18-alpine

# Instale dependências do sistema necessárias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Defina variáveis de ambiente para Puppeteer usar o Chromium do sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Defina o diretório de trabalho no container
WORKDIR /usr/src/app

# Copie os arquivos de definição de dependências
COPY package*.json ./

# Instale apenas dependências de produção
# Usa npm install porque pode não haver package-lock.json
RUN npm install --omit=dev && npm cache clean --force

# Copie o código da aplicação (inclui docker-entrypoint.sh)
COPY . .

# Configure o script de entrypoint no sistema
RUN chmod +x docker-entrypoint.sh && \
    cp docker-entrypoint.sh /usr/local/bin/ && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Crie um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app && \
    chown nodejs:nodejs /usr/local/bin/docker-entrypoint.sh

# Permissões para Chromium (Puppeteer)
RUN chmod 755 /usr/bin/chromium-browser && \
    mkdir -p /home/nodejs/.cache && \
    chown -R nodejs:nodejs /home/nodejs

USER nodejs

# Exponha a porta que a aplicação usará
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use o entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Comando para rodar a aplicação em modo produção
CMD ["node", "src/server.js"]

