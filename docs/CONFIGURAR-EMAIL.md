# 📧 Como Configurar Envio de Emails

📖 **Documentação relacionada:**
- [Email Setup Backend](../backend/EMAIL-SETUP.md) - Configuração detalhada
- [Template ENV](ENV-TEMPLATE.md) - Variáveis de ambiente
- [README Principal](../README.md) - Documentação completa

## Problema Identificado

As variáveis SMTP não estão sendo carregadas no container Docker. Os logs mostram:
```
SMTP_HOST: não definido
SMTP_USER: não definido
SMTP_PASSWORD: não definido
```

## ✅ Solução

### 1. Adicionar Variáveis SMTP no arquivo `.env` (raiz do projeto)

Abra o arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:

```env
# Configuração SMTP para envio de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
SMTP_FROM=TraderNex <seu_email@gmail.com>
```

### 2. Para Gmail (Recomendado)

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro (nome personalizado)"
   - Digite "TraderNex"
   - Copie a senha gerada (16 caracteres)
   - Use essa senha no `SMTP_PASSWORD`

**Exemplo para Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=TraderNex <seu_email@gmail.com>
```

### 3. Para Outros Provedores

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.sua_api_key_aqui
SMTP_FROM=TraderNex <noreply@tradernex.com>
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@outlook.com
SMTP_PASSWORD=sua_senha
SMTP_FROM=TraderNex <seu_email@outlook.com>
```

### 4. Reiniciar o Container

Após adicionar as variáveis, **reinicie o container do backend**:

```bash
docker-compose restart backend
```

Ou pare e inicie novamente:

```bash
docker-compose down
docker-compose up -d
```

### 5. Verificar se as Variáveis Foram Carregadas

Execute no terminal:

```bash
docker-compose exec backend printenv | grep SMTP
```

Você deve ver:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=****
SMTP_FROM=TraderNex <seu_email@gmail.com>
```

### 6. Testar o Envio

Tente recuperar a senha novamente. Os logs devem mostrar:
```
[emailService] SMTP_HOST: smtp.gmail.com
[emailService] SMTP_USER: definido
[emailService] SMTP_PASSWORD: definido
[emailService] Criando transporter SMTP...
✅ Email de recuperação enviado para...
```

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git
- Use senhas de app para Gmail (não a senha normal)
- Mantenha as credenciais seguras

## 🔍 Troubleshooting

### Variáveis ainda não aparecem após reiniciar?

1. Verifique se o `.env` está na **raiz do projeto** (mesmo nível do `docker-compose.yml`)
2. Verifique se não há espaços extras ou aspas nas variáveis
3. Pare todos os containers e inicie novamente:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Erro "Invalid login" ou "Authentication failed"?

- Para Gmail: Use senha de app, não a senha normal
- Verifique se a verificação em duas etapas está ativa
- Confirme que o email e senha estão corretos

### Emails não chegam?

- Verifique a pasta de spam
- Confirme que o email de destino está correto
- Verifique os logs do backend para erros

