-- ============================================================================
-- Migração: Adicionar status 'pending' ao constraint da tabela mt4_accounts
-- Data: 2025-12-26
-- Descrição: Permite que contas MT4 sejam criadas com status 'pending' 
--            até serem ativadas pelo administrador
-- ============================================================================

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

-- Comentário
COMMENT ON COLUMN mt4_accounts.status IS 'Status da conta: active (ativa), inactive (inativa), suspended (suspensa), pending (aguardando ativação)';

