# 📝 Template de Variáveis de Ambiente

Copie este conteúdo para um arquivo `.env` na raiz do projeto.

```env
# ============================================================================
# TraderNex - Variáveis de Ambiente
# ============================================================================

# ----------------------------------------------------------------------------
# Configuração do Banco de Dados PostgreSQL
# ----------------------------------------------------------------------------
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres_aqui
DB_NAME=tradernex

# ----------------------------------------------------------------------------
# Configuração JWT (Autenticação)
# ----------------------------------------------------------------------------
# IMPORTANTE: Gere uma chave secreta forte para produção!
# Você pode gerar uma com: openssl rand -base64 32
JWT_SECRET=sua_chave_secreta_jwt_forte_aqui
JWT_EXPIRE=7d

# ----------------------------------------------------------------------------
# Configuração do Frontend
# ----------------------------------------------------------------------------
FRONTEND_URL=http://localhost:3000

# ----------------------------------------------------------------------------
# Configuração de Email (SMTP)
# ----------------------------------------------------------------------------
# Opção 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_do_gmail
SMTP_FROM=TraderNex <seu_email@gmail.com>

# Opção 2: SendGrid (descomente se preferir)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=apikey
# SMTP_PASSWORD=SG.sua_api_key_aqui
# SMTP_FROM=TraderNex <noreply@tradernex.com>

# ----------------------------------------------------------------------------
# Configuração do Servidor Backend
# ----------------------------------------------------------------------------
PORT=5000
NODE_ENV=development
```

## 🔐 Como Configurar Gmail

1. Ative a verificação em duas etapas na sua conta Google
2. Acesse: https://myaccount.google.com/apppasswords
3. Gere uma "Senha de App" para "TraderNex"
4. Use a senha gerada no campo `SMTP_PASSWORD`

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git
- Use valores diferentes para desenvolvimento e produção
- Gere uma `JWT_SECRET` forte e única para produção
