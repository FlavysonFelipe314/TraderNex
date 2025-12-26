-- ============================================================================
-- MIGRACOES COMPLETAS - TraderNex
-- Execute este arquivo para aplicar TODAS as migrations pendentes
-- ============================================================================

-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Adicionar colunas de configurações operacionais MT4
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
COMMENT ON COLUMN mt4_accounts.automation_enabled IS 'Indica se o trading automatizado está habilitado';

ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
COMMENT ON COLUMN mt4_accounts.risk_profile IS 'Perfil de risco: conservador, moderado ou agressivo';

-- 4. Adicionar coluna selected_plan_id em client_profiles
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES investment_plans(id);
COMMENT ON COLUMN client_profiles.selected_plan_id IS 'Plano de investimento selecionado pelo usuário';
CREATE INDEX IF NOT EXISTS idx_client_profiles_selected_plan_id ON client_profiles(selected_plan_id);

-- 4.1. Adicionar coluna profit_fee_percentage na tabela investment_plans
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS profit_fee_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (profit_fee_percentage >= 0 AND profit_fee_percentage <= 100);
COMMENT ON COLUMN investment_plans.profit_fee_percentage IS 'Percentual de taxa sobre o lucro que será descontado do lucro do MyFXBook';

-- 5. Adicionar status 'pending' ao constraint da tabela mt4_accounts
ALTER TABLE mt4_accounts DROP CONSTRAINT IF EXISTS mt4_accounts_status_check;
ALTER TABLE mt4_accounts ADD CONSTRAINT mt4_accounts_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));
ALTER TABLE mt4_accounts ALTER COLUMN status SET DEFAULT 'pending';
COMMENT ON COLUMN mt4_accounts.status IS 'Status da conta: active (ativa), inactive (inativa), suspended (suspensa), pending (aguardando ativação)';

-- 5. Criar tabela system_myfxbook_config
CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);
COMMENT ON TABLE system_myfxbook_config IS 'Credenciais padrão do sistema para login no MyFXBook';

-- 6. Adicionar coluna profit_amount na tabela invoices (se necessário)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15, 2);
COMMENT ON COLUMN invoices.profit_amount IS 'Valor do lucro associado à fatura';

-- 7. Adicionar coluna fee_percentage na tabela invoices (se necessário)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fee_percentage DECIMAL(5, 2);
COMMENT ON COLUMN invoices.fee_percentage IS 'Percentual de taxa aplicado';

-- 8. Adicionar coluna plan_name na tabela invoices (se necessário)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
COMMENT ON COLUMN invoices.plan_name IS 'Nome do plano de investimento associado';

-- 9. Adicionar campos de lucro semanal em user_investments (se necessário)
ALTER TABLE user_investments ADD COLUMN IF NOT EXISTS last_weekly_profit DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE user_investments ADD COLUMN IF NOT EXISTS last_weekly_processed_date TIMESTAMP;

-- 10. Adicionar detalhes de comissão em referrals (se necessário)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS investment_amount DECIMAL(15, 2);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15, 2);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS broker_fee_percentage DECIMAL(5, 2);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS broker_profit DECIMAL(15, 2);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS last_commission_date TIMESTAMP;

-- 11. Adicionar coluna encrypted_password em myfxbook_connections (se necessário)
ALTER TABLE myfxbook_connections ADD COLUMN IF NOT EXISTS encrypted_password TEXT;
COMMENT ON COLUMN myfxbook_connections.encrypted_password IS 'Senha criptografada para conexão MyFXBook';

-- 12. Criar tabela crypto_interested (se necessário)
CREATE TABLE IF NOT EXISTS crypto_interested (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, email)
);
COMMENT ON TABLE crypto_interested IS 'Usuários interessados em investimentos em criptomoedas';

-- 13. Atualizar usuário admin (se existir)
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com' AND (is_admin IS NULL OR is_admin = FALSE);

-- ============================================================================
-- VERIFICAÇÕES
-- ============================================================================

-- Verificar coluna is_admin
SELECT 'is_admin' as migration, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'is_admin'
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- Verificar colunas mt4_accounts
SELECT 'mt4_accounts columns' as migration,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'mt4_accounts' 
           AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile')
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- Verificar coluna selected_plan_id
SELECT 'selected_plan_id' as migration,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'client_profiles' AND column_name = 'selected_plan_id'
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- Verificar tabela system_myfxbook_config
SELECT 'system_myfxbook_config' as migration,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'system_myfxbook_config'
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- Verificar tabela crypto_interested
SELECT 'crypto_interested' as migration,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'crypto_interested'
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- Verificar usuário admin
SELECT 'Admin user' as migration,
       CASE WHEN EXISTS (
           SELECT 1 FROM users WHERE email = 'admin@tradernex.com' AND is_admin = TRUE
       ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;



