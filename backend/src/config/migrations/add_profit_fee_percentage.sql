-- Adicionar coluna profit_fee_percentage na tabela investment_plans
ALTER TABLE investment_plans 
ADD COLUMN IF NOT EXISTS profit_fee_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (profit_fee_percentage >= 0 AND profit_fee_percentage <= 100);

-- Comentário
COMMENT ON COLUMN investment_plans.profit_fee_percentage IS 'Percentual de taxa sobre o lucro que será descontado do lucro do MyFXBook';

