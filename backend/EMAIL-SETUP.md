# 📧 Configuração de Email - TraderNex

Este documento explica como configurar o envio de emails para verificação de conta e recuperação de senha.

## 🎯 Funcionalidades Implementadas

✅ **Verificação de Email**: Enviado automaticamente após o registro  
✅ **Recuperação de Senha**: Enviado quando o usuário solicita reset de senha  
✅ **Templates HTML**: Emails com design profissional  
✅ **Modo Desenvolvimento**: Loga emails no console quando SMTP não está configurado

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# URL do Frontend (para links nos emails)
FRONTEND_URL=http://localhost:3000

# Configuração SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
SMTP_FROM=TraderNex <seu_email@gmail.com>
```

### 2. Opções de Provedores de Email

#### 📮 Gmail (Recomendado para Desenvolvimento)

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro (nome personalizado)"
   - Digite "TraderNex"
   - Copie a senha gerada
3. Use no `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu_email@gmail.com
   SMTP_PASSWORD=senha_de_app_gerada
   SMTP_FROM=TraderNex <seu_email@gmail.com>
   ```

#### 📮 SendGrid (Recomendado para Produção)

1. Crie uma conta em https://sendgrid.com
2. Crie uma API Key:
   - Settings → API Keys → Create API Key
   - Dê permissões de "Mail Send"
3. Use no `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.sua_api_key_aqui
   SMTP_FROM=TraderNex <noreply@tradernex.com>
   ```

#### 📮 AWS SES (Para Produção em Escala)

1. Configure o SES na AWS
2. Verifique seu domínio/email
3. Use no `.env`:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=sua_access_key
   SMTP_PASSWORD=sua_secret_key
   SMTP_FROM=TraderNex <noreply@tradernex.com>
   ```

#### 📮 Outros Provedores

Qualquer provedor SMTP padrão funciona. Configure:
- `SMTP_HOST`: Servidor SMTP
- `SMTP_PORT`: Porta (587 para TLS, 465 para SSL)
- `SMTP_SECURE`: `true` para SSL (porta 465), `false` para TLS (porta 587)
- `SMTP_USER`: Seu usuário/email
- `SMTP_PASSWORD`: Sua senha
- `SMTP_FROM`: Nome e email do remetente

## 🧪 Modo Desenvolvimento

Se você **não configurar** as variáveis SMTP, o sistema funcionará em modo desenvolvimento:

- ✅ Os emails serão **logados no console**
- ✅ Os links de verificação/reset serão exibidos
- ✅ Você pode copiar os links e testar manualmente
- ⚠️ Nenhum email real será enviado

Exemplo de saída no console:
```
═══════════════════════════════════════════
📧 EMAIL DE VERIFICAÇÃO (Desenvolvimento)
═══════════════════════════════════════════
Para: usuario@exemplo.com
Assunto: Verifique seu email - TraderNex
Link: http://localhost:3000/verify-email?token=...
═══════════════════════════════════════════
```

## 📝 Fluxo de Funcionamento

### Verificação de Email

1. Usuário se registra
2. Sistema gera token de verificação (válido por 24h)
3. Email é enviado com link: `${FRONTEND_URL}/verify-email?token=...`
4. Usuário clica no link
5. Frontend envia token para `/api/auth/verify-email`
6. Backend valida e marca email como verificado

### Recuperação de Senha

1. Usuário solicita reset em `/forgot-password`
2. Sistema gera token de reset (válido por 1h)
3. Email é enviado com link: `${FRONTEND_URL}/reset-password?token=...`
4. Usuário clica no link
5. Frontend exibe formulário de nova senha
6. Usuário envia nova senha para `/api/auth/reset-password`
7. Backend valida token e atualiza senha

## 🔒 Segurança

- ✅ Tokens têm expiração (24h para verificação, 1h para reset)
- ✅ Tokens são únicos e não reutilizáveis
- ✅ Tokens de reset são marcados como usados após uso
- ✅ Validação de propósito do token (email-verification vs password-reset)
- ✅ Não expõe informações sensíveis nos emails

## 🐛 Troubleshooting

### Email não está sendo enviado

1. Verifique se as variáveis SMTP estão corretas no `.env`
2. Verifique os logs do console para erros
3. Teste a conexão SMTP manualmente
4. Em desenvolvimento, verifique os logs no console

### Link não funciona

1. Verifique se `FRONTEND_URL` está correto
2. Verifique se o token não expirou
3. Verifique se o token foi usado (reset de senha)

### Gmail bloqueando

1. Use "Senha de App" ao invés da senha normal
2. Ative "Acesso a apps menos seguros" (não recomendado)
3. Considere usar SendGrid ou outro provedor

## 📚 Recursos

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [AWS SES Setup](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-smtp.html)
