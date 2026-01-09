-- Adicionar coluna benefits (JSONB) na tabela investment_plans
-- Armazena uma lista de benefícios/configurações do plano
ALTER TABLE investment_plans 
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;

-- Comentário
COMMENT ON COLUMN investment_plans.benefits IS 'Lista de benefícios do plano em formato JSON array de strings. Ex: ["Benefício 1", "Benefício 2"]';

-- Atualizar planos existentes com array vazio se não tiverem valores
UPDATE investment_plans 
SET benefits = '[]'::jsonb 
WHERE benefits IS NULL;

