-- Migration: Adicionar campos detalhados de comissão na tabela referrals
-- Data: 2025-01-XX

-- Adicionar campos para rastrear detalhes da comissão
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS investment_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS broker_fee_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS broker_profit DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS last_commission_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criar índice para melhorar performance em consultas por data
CREATE INDEX IF NOT EXISTS idx_referrals_last_commission_date ON referrals(last_commission_date);

-- Adicionar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
