-- Migration: Adicionar campos de senha e aprovação de credenciais MT4
-- Data: 2025-01-XX

-- Adicionar campos para armazenar senha e status de aprovação
ALTER TABLE mt4_accounts 
ADD COLUMN IF NOT EXISTS encrypted_password TEXT,
ADD COLUMN IF NOT EXISTS credentials_status VARCHAR(20) DEFAULT 'pending' CHECK (credentials_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS credentials_reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS credentials_reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS credentials_review_notes TEXT;

-- Comentários
COMMENT ON COLUMN mt4_accounts.encrypted_password IS 'Senha da conta MT4 criptografada';
COMMENT ON COLUMN mt4_accounts.credentials_status IS 'Status de aprovação das credenciais: pending, approved, rejected';
COMMENT ON COLUMN mt4_accounts.credentials_reviewed_at IS 'Data em que as credenciais foram revisadas pelo admin';
COMMENT ON COLUMN mt4_accounts.credentials_reviewed_by IS 'ID do admin que revisou as credenciais';
COMMENT ON COLUMN mt4_accounts.credentials_review_notes IS 'Notas do admin sobre a revisão das credenciais';

-- Criar índice para melhorar performance em consultas por status
CREATE INDEX IF NOT EXISTS idx_mt4_accounts_credentials_status ON mt4_accounts(credentials_status);

