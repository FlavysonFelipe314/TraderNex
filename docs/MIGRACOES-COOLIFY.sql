-- ============================================================================
-- MIGRACOES PARA COOLIFY - TraderNex
-- Execute este arquivo no Terminal do Coolify
-- ============================================================================

-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Comentário
COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 2. Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';

-- 3. Adicionar coluna automation_enabled na tabela mt4_accounts
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN mt4_accounts.automation_enabled IS 'Indica se o trading automatizado está habilitado';

-- 4. Adicionar coluna risk_profile na tabela mt4_accounts
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));

COMMENT ON COLUMN mt4_accounts.risk_profile IS 'Perfil de risco: conservador, moderado ou agressivo';

-- 5. Atualizar usuário admin (ajuste o email se necessário)
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';

-- ============================================================================
-- VERIFICAÇÕES (para confirmar que funcionou)
-- ============================================================================

-- Verificar coluna is_admin
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';

-- Verificar colunas mt4_accounts
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mt4_accounts' 
AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');

-- Verificar usuário admin
SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE is_admin = TRUE;
