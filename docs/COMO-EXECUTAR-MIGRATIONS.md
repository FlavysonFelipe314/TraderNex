# 🗄️ Como Executar Migrations - TraderNex

Este guia explica todas as formas de executar migrations no projeto TraderNex.

## 📋 Pré-requisitos

- Banco de dados `tradernex` criado
- Tabelas base criadas (via `npm run init-db`)
- Container backend rodando (se usar Docker)

---

## 🎯 Método 1: Via NPM Scripts (Recomendado)

### Migration Principal (MyFXBook)

```bash
# Dentro do container backend ou no diretório backend local
npm run migrate
```

Este comando executa a migration `add_myfxbook_table.sql`.

### Migration de Selected Plan ID

```bash
npm run migrate:selected-plan
```

---

## 🐳 Método 2: Via Docker Compose

Se você está usando Docker Compose:

### Executar Migration Principal

```bash
# Acessar o container backend
docker-compose exec backend npm run migrate

# Ou diretamente com node
docker-compose exec backend node src/config/runMigration.js
```

### Executar Migration de Selected Plan

```bash
docker-compose exec backend npm run migrate:selected-plan
```

---

## 🔧 Método 3: Executar SQL Diretamente no PostgreSQL

### Via psql (Linha de Comando)

1. **Conectar ao PostgreSQL:**

```bash
# Se estiver usando Docker
docker-compose exec db psql -U postgres -d tradernex

# Se PostgreSQL estiver local
psql -U postgres -d tradernex
```

2. **Executar o arquivo SQL de migration:**

```sql
-- Exemplo: executar migration de myfxbook
\i backend/src/config/migrations/add_myfxbook_table.sql

-- Ou copie e cole o conteúdo do arquivo diretamente
```

3. **Sair do psql:**

```sql
\q
```

### Via Arquivo SQL (Docker)

```bash
# Executar arquivo SQL diretamente via Docker
cat backend/src/config/migrations/add_myfxbook_table.sql | \
  docker-compose exec -T db psql -U postgres -d tradernex
```

**Windows PowerShell:**

```powershell
Get-Content backend/src/config/migrations/add_myfxbook_table.sql | \
  docker-compose exec -T db psql -U postgres -d tradernex
```

---

## 📁 Migrations Disponíveis

Lista de todas as migrations disponíveis em `backend/src/config/migrations/`:

1. **add_myfxbook_table.sql** - Cria tabela `myfxbook_connections`
   - Executar: `npm run migrate`

2. **add_selected_plan_id.sql** - Adiciona coluna `selected_plan_id`
   - Executar: `npm run migrate:selected-plan`

3. **add_is_admin_column.sql** - Adiciona coluna `is_admin` na tabela `users`

4. **add_mt4_settings_columns.sql** - Adiciona colunas de configuração MT4

5. **add_myfxbook_integration_login.sql** - Adiciona coluna de login MyFXBook

6. **add_myfxbook_password_column.sql** - Adiciona coluna de senha MyFXBook

7. **add_invoice_profit_field.sql** - Adiciona campo de lucro em invoices

8. **add_referral_commission_details.sql** - Adiciona detalhes de comissão

9. **add_weekly_profit_tracking.sql** - Adiciona rastreamento de lucro semanal

10. **add_system_myfxbook_config.sql** - Adiciona configuração do sistema MyFXBook

11. **add_crypto_interested_table.sql** - Cria tabela de interesse em crypto

---

## ⚠️ Importante: Ordem de Execução

### 1. Primeiro: Inicializar o Banco

```bash
npm run init-db
```

Isso cria todas as tabelas base do sistema.

### 2. Depois: Executar Migrations

Execute as migrations na ordem que fazem sentido para sua necessidade:

```bash
# Migration principal (MyFXBook)
npm run migrate

# Outras migrations conforme necessário
# (atualmente não há scripts npm para todas, então execute manualmente)
```

---

## 🔍 Verificar se Migration Foi Aplicada

### Verificar Tabela MyFXBook

```sql
-- Conectar ao PostgreSQL
psql -U postgres -d tradernex

-- Verificar se a tabela existe
\dt myfxbook_connections

-- Ver estrutura da tabela
\d myfxbook_connections

-- Verificar dados
SELECT * FROM myfxbook_connections LIMIT 5;
```

### Verificar Coluna is_admin

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';
```

### Verificar Outras Colunas

```sql
-- Ver todas as colunas de uma tabela
\d mt4_accounts

-- Ou via SQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mt4_accounts'
ORDER BY ordinal_position;
```

---

## 🆘 Solução de Problemas

### Erro: "function uuid_generate_v4() does not exist"

**Causa:** O schema está usando `uuid_generate_v4()` que requer extensão.

**Solução:** Já foi corrigido! O projeto agora usa `gen_random_uuid()` que é nativo do PostgreSQL 13+.

### Erro: "permission denied for language c"

**Causa:** Tentativa de criar extensão que requer permissões especiais.

**Solução:** Já foi corrigido! O projeto não usa mais extensões que requerem permissões especiais.

### Erro: "relation does not exist"

**Causa:** Tabelas base não foram criadas.

**Solução:** Execute primeiro:
```bash
npm run init-db
```

### Erro: "already exists"

**Causa:** A migration já foi aplicada anteriormente.

**Solução:** Isso é normal! O script trata isso automaticamente e não é um erro crítico.

---

## 📝 Executar Migration Manualmente (SQL Direto)

Se você precisa executar uma migration que não tem script npm:

1. **Localize o arquivo SQL:**
   ```
   backend/src/config/migrations/nome_da_migration.sql
   ```

2. **Copie o conteúdo do arquivo**

3. **Execute no PostgreSQL:**

   ```bash
   # Via Docker
   docker-compose exec db psql -U postgres -d tradernex
   
   # Cole o SQL e pressione Enter
   ```

   Ou:

   ```bash
   # Executar arquivo diretamente
   cat backend/src/config/migrations/nome_da_migration.sql | \
     docker-compose exec -T db psql -U postgres -d tradernex
   ```

---

## ✅ Checklist de Migrations

Use este checklist para garantir que todas as migrations foram aplicadas:

- [ ] Banco de dados `tradernex` criado
- [ ] Tabelas base criadas (`npm run init-db`)
- [ ] Migration MyFXBook aplicada (`npm run migrate`)
- [ ] Migration Selected Plan ID aplicada (`npm run migrate:selected-plan`)
- [ ] Outras migrations conforme necessário

---

## 📚 Referências

- Documentação PostgreSQL: https://www.postgresql.org/docs/
- Schema principal: `backend/src/config/schema.sql`
- Migrations: `backend/src/config/migrations/`
- Scripts de migration: `backend/src/config/runMigration*.js`







