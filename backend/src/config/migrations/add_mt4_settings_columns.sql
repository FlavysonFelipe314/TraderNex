-- Migração: Adicionar colunas de configurações operacionais na tabela mt4_accounts
-- Data: 2024

-- Adicionar colunas para armazenar configurações operacionais
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));

COMMENT ON COLUMN mt4_accounts.automation_enabled IS 'Indica se o trading automatizado está habilitado';
COMMENT ON COLUMN mt4_accounts.risk_profile IS 'Perfil de risco: conservador, moderado ou agressivo';
