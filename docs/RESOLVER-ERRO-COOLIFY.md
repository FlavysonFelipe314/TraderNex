# 🔧 Resolver Erro de Autenticação no Coolify

## 🚨 Problema

Os logs mostram repetidos erros:
```
FATAL: password authentication failed for user "postgres"
```

Isso significa que o backend não consegue conectar ao banco de dados porque as credenciais estão incorretas.

---

## ✅ Solução Rápida

### Passo 1: Verificar Variáveis de Ambiente

No Coolify:

1. Vá em **Configuration** → **Environment Variables**
2. Verifique se estas variáveis existem e estão corretas:

```
DB_HOST=<host-do-banco>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<senha-correta>
DB_NAME=tradernex
```

**⚠️ IMPORTANTE:**
- Se você está usando Docker Compose no Coolify, o `DB_HOST` pode ser `db` (nome do serviço)
- Se o banco está em outro serviço, use o host/IP completo
- A senha (`DB_PASSWORD`) deve ser **exatamente** a mesma configurada no PostgreSQL

### Passo 2: Testar Conexão

No **Terminal** do Coolify, execute:

```bash
# Testar conexão (substitua as variáveis pelos valores reais)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

Se der erro, as variáveis estão incorretas.

### Passo 3: Corrigir Variáveis

**Se o banco está no mesmo projeto (Docker Compose):**

1. Verifique o nome do serviço do banco no `docker-compose.yaml`
2. Use esse nome como `DB_HOST` (geralmente `db` ou `postgres`)
3. Use a mesma senha configurada no serviço do banco

**Exemplo:**
```
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=minhasenha123
DB_NAME=tradernex
```

**Se o banco está em outro serviço Coolify:**

1. Use o host/IP do banco
2. Configure porta, usuário, senha e nome do banco

**Se o banco está externo:**

1. Use o host completo (ex: `db.exemplo.com`)
2. Configure todas as credenciais

### Passo 4: Reiniciar o Backend

Após corrigir as variáveis:

1. No Coolify, vá em **Deployments**
2. Clique em **Redeploy** ou **Restart**
3. Aguarde o backend reiniciar
4. Verifique os logs novamente

---

## 🔍 Verificar se Está Funcionando

Após corrigir, os logs devem mostrar:

```
✅ Conectado ao banco de dados PostgreSQL
🔄 Inicializando banco de dados...
✅ Schema do banco de dados criado com sucesso!
```

**NÃO deve mais aparecer:**
```
FATAL: password authentication failed
```

---

## 📝 Aplicar Migrations (Depois de Resolver Autenticação)

Uma vez que a conexão estiver funcionando, aplique as migrations:

### Opção 1: Via Terminal do Coolify

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
EOF
```

### Opção 2: Via Arquivo

1. No Terminal do Coolify, copie o conteúdo de `MIGRACOES-COOLIFY.sql`
2. Cole e execute no psql:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f - << 'EOF'
# Cole aqui o conteúdo do arquivo MIGRACOES-COOLIFY.sql
EOF
```

---

## 🆘 Problemas Comuns

### Erro: "role postgres does not exist"

**Solução:** O usuário pode ser diferente. Verifique qual usuário está configurado no banco e ajuste `DB_USER`.

### Erro: "database tradernex does not exist"

**Solução:** Crie o banco primeiro:
```bash
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE tradernex;"
```

### Erro: "could not connect to server"

**Solução:** 
- Verifique se o banco está rodando
- Verifique o `DB_HOST`
- Se estiver no mesmo projeto, use o nome do serviço
- Verifique firewall/rede se for externo

---

## 💡 Dica

Se você não tem certeza das credenciais:

1. **No Coolify**, vá no serviço do banco de dados
2. Verifique as **Environment Variables** do banco
3. Use essas mesmas credenciais no backend

---

## ✅ Checklist

- [ ] Variáveis de ambiente configuradas corretamente
- [ ] `DB_HOST` correto (nome do serviço ou IP)
- [ ] `DB_USER` correto
- [ ] `DB_PASSWORD` correto (mesma do banco)
- [ ] `DB_NAME` existe
- [ ] Teste de conexão funcionando
- [ ] Backend reiniciado
- [ ] Logs sem erros de autenticação
- [ ] Migrations aplicadas (se necessário)
