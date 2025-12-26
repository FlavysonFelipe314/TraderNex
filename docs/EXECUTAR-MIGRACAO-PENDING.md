# 🗄️ Migração: Adicionar Status 'pending' na Tabela mt4_accounts

## 📋 Descrição

Esta migração atualiza o constraint da coluna `status` na tabela `mt4_accounts` para permitir o valor `'pending'`, que será usado para contas recém-criadas que aguardam ativação pelo administrador.

## 🚀 Como Executar

### Opção 1: Via SQL direto

Execute o seguinte comando SQL no seu banco de dados:

```sql
-- Remover o constraint antigo
ALTER TABLE mt4_accounts 
DROP CONSTRAINT IF EXISTS mt4_accounts_status_check;

-- Adicionar o novo constraint com 'pending'
ALTER TABLE mt4_accounts 
ADD CONSTRAINT mt4_accounts_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Atualizar o valor padrão para 'pending'
ALTER TABLE mt4_accounts 
ALTER COLUMN status SET DEFAULT 'pending';
```

### Opção 2: Via Docker

```bash
docker-compose exec db psql -U postgres -d tradernex -f /path/to/MIGRACAO-ADD-PENDING-STATUS.sql
```

Ou execute diretamente:

```bash
docker-compose exec db psql -U postgres -d tradernex -c "ALTER TABLE mt4_accounts DROP CONSTRAINT IF EXISTS mt4_accounts_status_check; ALTER TABLE mt4_accounts ADD CONSTRAINT mt4_accounts_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'pending')); ALTER TABLE mt4_accounts ALTER COLUMN status SET DEFAULT 'pending';"
```

### Opção 3: Via Coolify ou Servidor Remoto

1. Acesse o banco de dados via terminal ou cliente SQL
2. Execute o conteúdo do arquivo `MIGRACAO-ADD-PENDING-STATUS.sql`

## ✅ Verificação

Após executar a migração, verifique se o constraint foi atualizado:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'mt4_accounts'::regclass
AND conname = 'mt4_accounts_status_check';
```

O resultado deve mostrar:
```
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'pending'::text]))
```

## ⚠️ Importante

- Esta migração é **segura** e não afeta dados existentes
- Contas existentes com status 'active', 'inactive' ou 'suspended' continuarão funcionando normalmente
- Novas contas serão criadas com status 'pending' por padrão

