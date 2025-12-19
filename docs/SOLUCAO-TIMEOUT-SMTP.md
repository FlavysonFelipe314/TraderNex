# 🔧 Solução: Timeout SMTP

Este guia explica como resolver problemas de timeout ao enviar emails via SMTP.

## ❌ Erro Atual

```
❌ Erro ao enviar email de verificação: Connection timeout
code: 'ETIMEDOUT',
command: 'CONN'
```

## 🔍 Diagnóstico

O erro `ETIMEDOUT` com `command: 'CONN'` indica que o problema está na **conexão inicial** com o servidor SMTP, não no envio do email em si.

## ✅ Soluções

### Opção 1: Verificar Acessibilidade do Servidor SMTP

Teste se o servidor SMTP está acessível do container:

```bash
# No terminal do container backend
telnet smtp-relay.brevo.com 587
# ou
nc -zv smtp-relay.brevo.com 587
```

Se não conseguir conectar, o problema é de rede/firewall.

### Opção 2: Usar Porta 465 (SSL/TLS)

A porta 465 usa SSL/TLS direto e pode ser mais confiável:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu_usuario
SMTP_PASSWORD=sua_senha
```

### Opção 3: Ajustar Timeouts

Se o servidor SMTP é lento, aumente os timeouts:

```env
SMTP_CONNECTION_TIMEOUT=15000
SMTP_GREETING_TIMEOUT=15000
SMTP_SOCKET_TIMEOUT=15000
```

### Opção 4: Verificar Credenciais Brevo

Para Brevo (anteriormente Sendinblue):

1. Acesse: https://app.brevo.com/settings/keys/api
2. Verifique se está usando as credenciais corretas
3. Para SMTP, use:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS) ou `465` (SSL)
   - **Login**: Seu email de login no Brevo
   - **Password**: Sua senha SMTP (não a senha da conta)

### Opção 5: Verificar Firewall/Network

No Coolify, verifique:

1. **Network Policies**: O container pode fazer conexões de saída na porta 587/465?
2. **Firewall**: Há algum firewall bloqueando conexões SMTP?
3. **DNS**: O DNS está resolvendo corretamente `smtp-relay.brevo.com`?

### Opção 6: Usar Servidor SMTP Alternativo

Se Brevo não funcionar, tente outro provedor:

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=senha_de_app_gerada
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.sua_api_key
```

## 🔧 Configuração Recomendada para Brevo

```env
# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=seu_email@exemplo.com
SMTP_PASSWORD=sua_senha_smtp
SMTP_FROM=TraderNex <noreply@tradernex.com>

# Timeouts (opcional, padrão é 8 segundos)
SMTP_CONNECTION_TIMEOUT=10000
SMTP_GREETING_TIMEOUT=10000
SMTP_SOCKET_TIMEOUT=10000
```

## 📝 Nota Importante

O sistema **não quebra** se o email falhar. O registro de usuário continua funcionando mesmo se o email não for enviado. O usuário pode verificar o email mais tarde ou solicitar reenvio.

## 🧪 Testar Conexão SMTP

Para testar a conexão SMTP diretamente:

```bash
# No terminal do container backend
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  connectionTimeout: 10000
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ Servidor SMTP está pronto!');
  }
  process.exit(error ? 1 : 0);
});
"
```

## 🆘 Se Nada Funcionar

1. **Desabilitar SMTP temporariamente**: Remova `SMTP_HOST` do `.env` - os emails serão logados no console
2. **Usar serviço de email externo**: Configure um webhook ou API para enviar emails
3. **Verificar logs do Coolify**: Pode haver mais informações sobre o problema de rede
