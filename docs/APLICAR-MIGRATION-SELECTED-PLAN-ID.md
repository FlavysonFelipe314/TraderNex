# 🔧 Aplicar Migration: selected_plan_id

Este guia explica como aplicar a migration que adiciona a coluna `selected_plan_id` na tabela `client_profiles`.

## ❌ Erro Atual

```
Erro ao buscar usuários: error: column cp.selected_plan_id does not exist
```

## ✅ Solução

Execute o seguinte SQL no banco de dados:

### Opção 1: Via Terminal do Coolify

1. Acesse o terminal do container do backend no Coolify
2. Execute:

```bash
# Conectar ao banco de dados
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Ou se estiver dentro do container backend
psql -h db -U postgres -d tradernex
```

3. Cole e execute o SQL abaixo:

```sql
-- Adicionar coluna selected_plan_id em client_profiles
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES investment_plans(id);

-- Comentário
COMMENT ON COLUMN client_profiles.selected_plan_id IS 'Plano de investimento selecionado pelo usuário';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_selected_plan_id ON client_profiles(selected_plan_id);
```

### Opção 2: Via Script Node.js (Recomendado) ⭐

**No Coolify:**

1. Acesse o terminal do container backend no Coolify
2. Execute:

```bash
npm run migrate:selected-plan
```

**Ou manualmente:**

```bash
# No terminal do Coolify, acesse o container backend
node src/config/runMigrationSelectedPlanId.js
```

Este script:
- ✅ Verifica conexão com o banco de dados
- ✅ Verifica se a tabela `client_profiles` existe
- ✅ Verifica se a coluna já existe antes de criar
- ✅ Aplica a migration de forma segura
- ✅ Verifica se foi aplicada corretamente
- ✅ Não causa erro se a coluna já existir
- ✅ Mostra logs detalhados para debug

### Opção 3: Via Arquivo SQL

1. Copie o conteúdo do arquivo `backend/src/config/migrations/add_selected_plan_id.sql`
2. Execute no banco de dados usando qualquer cliente PostgreSQL (pgAdmin, DBeaver, etc.)

## 🔍 Verificar se a Migration Foi Aplicada

Execute no banco de dados:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
AND column_name = 'selected_plan_id';
```

Se retornar uma linha, a migration foi aplicada com sucesso!

## 📝 Nota

O código do backend foi atualizado para ser mais resiliente e não quebrar caso a coluna não exista, mas é recomendado aplicar a migration para funcionalidade completa.

