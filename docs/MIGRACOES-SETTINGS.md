# 🗄️ Migração: Adicionar Configurações Operacionais MT4

## 📋 Comando SQL para Executar

Execute este comando no banco de dados:

```sql
-- Adicionar colunas de configurações operacionais
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));

COMMENT ON COLUMN mt4_accounts.automation_enabled IS 'Indica se o trading automatizado está habilitado';
COMMENT ON COLUMN mt4_accounts.risk_profile IS 'Perfil de risco: conservador, moderado ou agressivo';
```

## 🐳 Com Docker

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE; ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));"
```

## ✅ Verificação

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mt4_accounts' 
AND column_name IN ('automation_enabled', 'risk_profile');
```

