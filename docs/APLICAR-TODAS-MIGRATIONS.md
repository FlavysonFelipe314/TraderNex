# 🚀 Aplicar TODAS as Migrations - TraderNex

Este guia explica como aplicar todas as migrations pendentes de uma vez para corrigir os erros de colunas/tabelas faltantes.

## 🚨 Problema

Você está vendo erros como:
- `column cp.selected_plan_id does not exist`
- `relation "system_myfxbook_config" does not exist`

Isso significa que algumas migrations não foram aplicadas.

---

## ✅ Solução: Executar Todas as Migrations

### Método 1: Via Script NPM (Recomendado)

```bash
# Dentro do container backend ou no diretório backend
npm run migrate:all
```

Este comando executa automaticamente todas as migrations em ordem.

### Método 2: Via Docker Compose

```bash
# Executar todas as migrations
docker-compose exec backend npm run migrate:all

# Ou diretamente com node
docker-compose exec backend node src/config/runAllMigrations.js
```

---

## 🔧 Método 3: Via SQL Direto (Coolify)

Se você está no Coolify e precisa executar manualmente:

### Passo 1: Acessar o Terminal do Backend

No Coolify:
1. Vá para o serviço **backend**
2. Clique em **Terminal**
3. Execute:

```bash
npm run migrate:all
```

### Passo 2: Ou Executar SQL Direto no Banco

1. No Coolify, vá para o serviço do **banco de dados PostgreSQL**
2. Clique em **Terminal**
3. Execute:

```bash
psql -U postgres -d tradernex
```

4. Cole o conteúdo do arquivo `docs/MIGRACOES-COMPLETAS-TODAS.sql`

Ou execute diretamente:

```bash
cat docs/MIGRACOES-COMPLETAS-TODAS.sql | psql -U postgres -d tradernex
```

---

## 📋 O que o Script Faz

O script `runAllMigrations.js`:

1. ✅ Executa todas as migrations em `backend/src/config/migrations/`
2. ✅ Aplica migrations críticas que podem estar faltando:
   - Coluna `selected_plan_id` em `client_profiles`
   - Tabela `system_myfxbook_config`
3. ✅ Verifica se as migrations foram aplicadas corretamente
4. ✅ Mostra status de cada migration

---

## 🔍 Verificar se Funcionou

Após executar, verifique:

### 1. Verificar Coluna selected_plan_id

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
AND column_name = 'selected_plan_id';
```

Deve retornar: `selected_plan_id`

### 2. Verificar Tabela system_myfxbook_config

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'system_myfxbook_config';
```

Deve retornar: `system_myfxbook_config`

### 3. Verificar Coluna is_admin

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'is_admin';
```

Deve retornar: `is_admin`

---

## 🆘 Se Ainda Houver Erros

### Erro: "permission denied"

Se você receber erro de permissão, pode ser que o usuário do banco não tenha privilégios suficientes. Execute como superusuário:

```sql
-- Conectar como superusuário
psql -U postgres -d tradernex

-- Depois execute as migrations
```

### Erro: "relation does not exist" em tabelas base

Se aparecer erro de tabelas base não existirem, primeiro inicialize o banco:

```bash
npm run init-db
```

Depois execute as migrations:

```bash
npm run migrate:all
```

---

## 📝 Ordem Correta de Execução

1. **Criar banco** (se não existir):
   ```bash
   npm run create-db
   ```

2. **Inicializar schema**:
   ```bash
   npm run init-db
   ```

3. **Aplicar todas as migrations**:
   ```bash
   npm run migrate:all
   ```

4. **Popular com dados iniciais** (opcional):
   ```bash
   npm run seed
   ```

---

## 🔄 Executar Novamente

O script é **idempotente** (pode ser executado múltiplas vezes):

- ✅ Usa `IF NOT EXISTS` para evitar erros
- ✅ Não cria duplicatas
- ✅ Seguro para executar várias vezes

Você pode executar `npm run migrate:all` quantas vezes quiser sem problemas.

---

## 📚 Arquivos Relacionados

- Script principal: `backend/src/config/runAllMigrations.js`
- SQL completo: `docs/MIGRACOES-COMPLETAS-TODAS.sql`
- Migrations individuais: `backend/src/config/migrations/*.sql`

---

## ✅ Checklist Final

Após executar, verifique se os seguintes erros desapareceram:

- [ ] `column cp.selected_plan_id does not exist` → ✅ Resolvido
- [ ] `relation "system_myfxbook_config" does not exist` → ✅ Resolvido
- [ ] `/api/admin/users` retorna 200 (não mais 500) → ✅ Funcionando
- [ ] `/api/admin/system/myfxbook-config` retorna 200 → ✅ Funcionando

---

## 🎯 Comando Rápido (Tudo de Uma Vez)

```bash
# Executar tudo de uma vez (se já tiver o banco criado)
npm run init-db && npm run migrate:all && npm run seed
```









