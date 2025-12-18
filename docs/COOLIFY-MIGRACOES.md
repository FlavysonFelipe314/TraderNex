# 🚀 Aplicar Migrations no Coolify

Este guia mostra como aplicar as migrations do banco de dados quando o projeto está rodando no **Coolify**.

## 🔍 Problema Identificado

Os logs mostram erros de autenticação:
```
FATAL: password authentication failed for user "postgres"
```

Isso indica que as variáveis de ambiente do banco de dados não estão configuradas corretamente no Coolify.

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar Variáveis de Ambiente no Coolify

1. No painel do Coolify, vá para o projeto **tradernex**
2. Clique em **Configuration** → **Environment Variables**
3. Verifique se estas variáveis estão configuradas:

```
DB_HOST=<host-do-banco-coolify>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<senha-correta-do-banco>
DB_NAME=tradernex
```

**⚠️ IMPORTANTE:** 
- Se você está usando um banco de dados gerenciado pelo Coolify, o `DB_HOST` pode ser o nome do serviço (ex: `db` ou `postgres`)
- Se você está usando um banco externo, use o host/IP completo

### Passo 2: Verificar se o Banco de Dados Existe

No Coolify, você pode usar o **Terminal** do projeto para verificar:

1. Vá em **Terminal** no projeto
2. Execute:

```bash
# Verificar se consegue conectar ao banco
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

Se der erro, verifique as variáveis de ambiente primeiro.

### Passo 3: Aplicar as Migrations

#### Opção A: Via Terminal do Coolify (Recomendado)

1. No Coolify, vá em **Terminal** do projeto **tradernex**
2. Execute este comando para aplicar as migrations:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
EOF
```

#### Opção B: Via Arquivo SQL

1. No Terminal do Coolify, crie um arquivo temporário:

```bash
cat > /tmp/migrations.sql << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
EOF
```

2. Execute:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f /tmp/migrations.sql
```

#### Opção C: Via Container do Backend

Se o backend estiver rodando em um container:

1. No Terminal do Coolify, entre no container do backend:

```bash
# Listar containers
docker ps

# Entrar no container do backend (ajuste o nome se necessário)
docker exec -it tradernex-backend sh
```

2. Dentro do container, execute:

```bash
# O backend já tem acesso às variáveis de ambiente
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
EOF
```

### Passo 4: Verificar se Funcionou

Execute no Terminal do Coolify:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';"
```

Você deve ver:
```
 column_name 
-------------
 is_admin
```

---

## 🔧 Configuração Correta no Coolify

### Se o Banco Está no Mesmo Projeto (Docker Compose)

Se você está usando `docker-compose.yaml` no Coolify:

1. O serviço do banco deve estar configurado
2. As variáveis de ambiente devem usar o nome do serviço como host:
   ```
   DB_HOST=db
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<sua-senha>
   DB_NAME=tradernex
   ```

### Se o Banco Está em Outro Serviço Coolify

1. Use o host/IP do banco de dados
2. Configure as variáveis de ambiente com as credenciais corretas

### Se o Banco Está Externo

1. Configure o host completo (ex: `db.exemplo.com`)
2. Configure porta, usuário, senha e nome do banco

---

## 🆘 Resolver Erros de Autenticação

### Erro: "password authentication failed"

**Causa:** Senha incorreta ou usuário não existe

**Solução:**
1. Verifique a senha no Coolify (Environment Variables)
2. Se necessário, redefina a senha do PostgreSQL
3. Certifique-se de que `DB_USER` e `DB_PASSWORD` estão corretos

### Erro: "could not connect to server"

**Causa:** Host incorreto ou banco não está acessível

**Solução:**
1. Verifique se o banco está rodando
2. Verifique o `DB_HOST` nas variáveis de ambiente
3. Se estiver no mesmo projeto, use o nome do serviço (ex: `db`)
4. Se estiver externo, verifique firewall/rede

### Erro: "database tradernex does not exist"

**Causa:** Banco de dados não foi criado

**Solução:**
```bash
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE tradernex;"
```

---

## 📝 Checklist Rápido

- [ ] Variáveis de ambiente configuradas no Coolify
- [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` corretos
- [ ] Banco de dados existe e está acessível
- [ ] Migrations aplicadas com sucesso
- [ ] Verificações executadas e confirmadas
- [ ] Backend reiniciado após migrations (se necessário)

---

## ✨ Após Aplicar as Migrations

1. **Reinicie o backend** no Coolify (se necessário)
2. **Verifique os logs** para confirmar que não há mais erros de autenticação
3. **Teste o painel admin** acessando `/admin` na aplicação
4. **Configure um usuário como admin** se ainda não tiver

---

## 💡 Dica

Se você não tem acesso direto ao Terminal do Coolify, você pode:

1. **Adicionar um script de inicialização** no backend que aplica as migrations automaticamente
2. **Usar um job/script** que roda antes do deploy
3. **Aplicar manualmente via SQL** usando uma ferramenta de gerenciamento de banco (pgAdmin, DBeaver, etc.)
