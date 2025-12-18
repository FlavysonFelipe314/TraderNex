# 🗄️ Como Executar as Migrações Corretamente

## ⚠️ Erro Comum

Se você está vendo erros como `sh: ALTER: not found`, significa que está executando SQL diretamente no shell do container, e não no **psql**.

## ✅ Forma Correta

### Opção 1: Executar Script Automático (Recomendado)

```powershell
.\run-migrations.ps1
```

Este script faz tudo automaticamente!

---

### Opção 2: Executar Manualmente via Docker

#### Passo 1: Acessar o psql (NÃO o shell do container!)

```powershell
docker-compose exec db psql -U postgres -d tradernex
```

**Importante:** Você deve ver o prompt `tradernex=#` (não `/#`)

#### Passo 2: Executar os comandos SQL

Cole TODOS os comandos de uma vez:

```sql
-- 1. Adicionar coluna is_admin
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Adicionar colunas de configurações operacionais
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));

-- 4. Atualizar usuário admin
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'admin@tradernex.com';

-- Verificar
SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE is_admin = TRUE;

-- Sair do psql
\q
```

---

### Opção 3: Executar via Arquivo SQL

#### Criar arquivo `migrations.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
```

#### Executar o arquivo:

```powershell
Get-Content migrations.sql | docker-compose exec -T db psql -U postgres -d tradernex
```

---

## 🔍 Como Saber se Está no Lugar Certo

### ❌ ERRADO (Shell do container):
```
/ # ALTER TABLE users
sh: ALTER: not found
```

### ✅ CORRETO (psql):
```
tradernex=# ALTER TABLE users
tradernex=# ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE
```

---

## 📝 Comando Completo em Uma Linha

Se quiser executar tudo de uma vez sem entrar no psql:

```powershell
docker-compose exec -T db psql -U postgres -d tradernex -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE; CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin); ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100); ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE; ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo')); UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';"
```

---

## ✅ Verificação

Depois de executar, verifique:

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';"
docker-compose exec db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'mt4_accounts' AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');"
docker-compose exec db psql -U postgres -d tradernex -c "SELECT email, is_admin FROM users WHERE is_admin = TRUE;"
```

---

## 🚀 Solução Rápida

**Use o script automático:**

```powershell
.\run-migrations.ps1
```

Ele faz tudo automaticamente e mostra se deu certo ou não!
