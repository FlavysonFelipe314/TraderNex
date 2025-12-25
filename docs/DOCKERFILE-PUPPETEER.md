# Configuração do Dockerfile para Puppeteer

## Mudanças Realizadas

### 1. Dependências do Sistema (Alpine Linux)

Adicionadas dependências necessárias para o Puppeteer funcionar no Alpine Linux:

```dockerfile
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*
```

### 2. Variáveis de Ambiente

Configuradas variáveis para o Puppeteer usar o Chromium do sistema:

```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

Isso evita que o Puppeteer tente baixar o Chromium (economiza tempo e espaço).

### 3. Permissões para Usuário Não-Root

Adicionadas permissões necessárias para o usuário `nodejs` executar o Chromium:

```dockerfile
RUN chmod 755 /usr/bin/chromium-browser && \
    mkdir -p /home/nodejs/.cache && \
    chown -R nodejs:nodejs /home/nodejs
```

### 4. Configuração do Puppeteer no Código

O código foi atualizado para usar o Chromium do sistema quando disponível:

```javascript
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

browser = await puppeteerLib.launch({
  headless: true,
  executablePath: executablePath,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process' // Necessário para Docker
  ]
});
```

## Benefícios

1. **Menor tamanho da imagem**: Usa Chromium do sistema em vez de baixar
2. **Mais rápido**: Não precisa baixar Chromium durante o build
3. **Seguro**: Mantém usuário não-root
4. **Compatível**: Funciona em ambientes Docker/Alpine

## Troubleshooting

### Erro: "Failed to launch browser"

- Verifique se o Chromium está instalado: `which chromium-browser`
- Verifique permissões: `ls -la /usr/bin/chromium-browser`
- Verifique se o usuário tem acesso: `id nodejs`

### Erro: "No usable sandbox"

- Os argumentos `--no-sandbox` e `--disable-setuid-sandbox` já estão configurados
- Se persistir, verifique se o container tem privilégios adequados

### Erro: "Shared memory"

- O argumento `--disable-dev-shm-usage` já está configurado
- Se persistir, pode ser necessário aumentar `/dev/shm` no Docker

## Notas

- O Puppeteer é carregado dinamicamente apenas quando necessário
- Se o Puppeteer não estiver instalado, o sistema tenta requisições HTTP normais primeiro
- O fallback para Puppeteer só acontece quando detecta desafio do Cloudflare

