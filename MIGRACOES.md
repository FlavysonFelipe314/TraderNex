# 🗄️ Comandos de Migração do Banco de Dados

Este arquivo contém os comandos necessários para executar as migrações do banco de dados.

## 📋 Migrações Necessárias

1. Adicionar coluna `is_admin` na tabela `users`
2. Adicionar coluna `myfxbook_integration_login` na tabela `mt4_accounts`
3. Atualizar usuário admin para ter `is_admin = true`

---

## 🐳 Opção 1: Usando Docker (Recomendado)

### Passo 1: Acessar o container do banco de dados

```bash
docker-compose exec db psql -U postgres -d tradernex
```

Ou se o nome do container for diferente:

```bash
docker exec -it tradernex-db psql -U postgres -d tradernex
```

### Passo 2: Executar as migrações

Cole os seguintes comandos SQL no terminal do PostgreSQL:

```sql
-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Atualizar usuário admin (substitua 'admin@tradernex.com' pelo email do seu admin)
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'admin@tradernex.com';

-- Verificar se foi atualizado
SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE email = 'admin@tradernex.com';

-- Sair do psql
\q
```

---

## 💻 Opção 2: Usando psql diretamente (sem Docker)

Se você tem acesso direto ao PostgreSQL:

```bash
psql -U postgres -d tradernex -h localhost
```

Depois execute os mesmos comandos SQL acima.

---

## 📝 Opção 3: Executar via arquivo SQL

### Criar arquivo com todas as migrações:

```bash
# Criar arquivo de migração
cat > migrations.sql << 'EOF'
-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Atualizar usuário admin
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'admin@tradernex.com';
EOF
```

### Executar o arquivo:

**Com Docker:**
```bash
docker-compose exec -T db psql -U postgres -d tradernex < migrations.sql
```

**Sem Docker:**
```bash
psql -U postgres -d tradernex -h localhost -f migrations.sql
```

---

## ✅ Verificação

Após executar as migrações, verifique se tudo está correto:

```sql
-- Verificar coluna is_admin
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';

-- Verificar coluna myfxbook_integration_login
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mt4_accounts' AND column_name = 'myfxbook_integration_login';

-- Verificar usuário admin
SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE is_admin = TRUE;
```

---

## 🔧 Comandos Úteis

### Ver todas as tabelas:
```sql
\dt
```

### Ver estrutura de uma tabela:
```sql
\d users
\d mt4_accounts
```

### Listar todos os usuários:
```sql
SELECT id, email, first_name, last_name, is_admin, is_active 
FROM users;
```

### Criar um novo usuário admin:
```sql
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'seu-email@exemplo.com';
```

---

## ⚠️ Importante

- **Backup**: Sempre faça backup do banco antes de executar migrações em produção
- **Email do Admin**: Certifique-se de usar o email correto do usuário admin na atualização
- **Teste**: Teste as migrações em ambiente de desenvolvimento primeiro

---

## 🚀 Após as Migrações

1. Reinicie o backend se necessário:
   ```bash
   docker-compose restart backend
   ```

2. Faça login com o usuário admin e acesse `/admin` para testar o painel administrativo

3. Verifique se o link "Painel Admin" aparece no Sidebar (apenas para admins)
