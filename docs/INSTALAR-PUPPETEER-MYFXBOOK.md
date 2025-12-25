# Instalar Puppeteer para Contornar Cloudflare

## Problema

O MyFXBook está usando Cloudflare para proteger sua API, retornando um desafio JavaScript ("Just a moment... Enable JavaScript and cookies to continue") que bloqueia requisições HTTP simples.

## Solução

O sistema agora detecta automaticamente o desafio do Cloudflare e usa **Puppeteer** para simular um navegador real e contornar a proteção.

## Instalação

### 1. Instalar Puppeteer

No diretório `backend`, execute:

```bash
npm install puppeteer
```

### 2. Verificar Instalação

Após a instalação, o sistema detectará automaticamente quando o Cloudflare bloquear uma requisição e tentará usar Puppeteer.

## Como Funciona

1. **Tentativa Normal**: O sistema primeiro tenta fazer login usando requisições HTTP normais
2. **Detecção do Desafio**: Se receber um desafio do Cloudflare (403 com HTML contendo "Just a moment"), o sistema detecta automaticamente
3. **Fallback para Puppeteer**: O sistema abre um navegador headless (sem interface gráfica) usando Puppeteer
4. **Execução do JavaScript**: O Puppeteer executa o JavaScript do Cloudflare e passa pelo desafio
5. **Obtenção da Sessão**: Após passar pelo desafio, o sistema obtém a sessão do MyFXBook

## Requisitos

- Node.js instalado
- Espaço em disco: Puppeteer baixa o Chromium (~170MB)
- Memória: Puppeteer usa mais memória que requisições HTTP simples

## Notas Importantes

- **Performance**: Puppeteer é mais lento que requisições HTTP diretas (pode levar 10-30 segundos)
- **Recursos**: Usa mais CPU e memória do servidor
- **Alternativa**: Se possível, contate o suporte do MyFXBook para obter acesso oficial à API

## Troubleshooting

### Erro: "Puppeteer não está instalado"

Execute: `npm install puppeteer` no diretório `backend`

### Erro: "Failed to launch browser"

Verifique se há espaço em disco suficiente e permissões adequadas.

### Timeout ao usar Puppeteer

O desafio do Cloudflare pode levar mais tempo. O sistema aguarda até 30 segundos.

## Logs

Quando o Puppeteer é usado, você verá logs como:

```
[Myfxbook] Desafio do Cloudflare detectado. Tentando com Puppeteer...
[Myfxbook Puppeteer] Iniciando navegador...
[Myfxbook Puppeteer] Acessando URL de login...
[Myfxbook Puppeteer] Login bem-sucedido!
```

