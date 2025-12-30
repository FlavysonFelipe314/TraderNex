-- Migration: Adicionar campos de status de aprovação de plano em client_profiles
-- Data: 2025-01-XX

-- Adicionar campos para controle de aprovação de plano
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'pending' CHECK (plan_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS plan_reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS plan_reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS plan_review_notes TEXT;

-- Comentários
COMMENT ON COLUMN client_profiles.plan_status IS 'Status de aprovação do plano: pending, approved, rejected';
COMMENT ON COLUMN client_profiles.plan_reviewed_at IS 'Data em que o plano foi revisado pelo admin';
COMMENT ON COLUMN client_profiles.plan_reviewed_by IS 'ID do admin que revisou o plano';
COMMENT ON COLUMN client_profiles.plan_review_notes IS 'Notas do admin sobre a revisão do plano';

-- Criar índice para melhorar performance em consultas por status
CREATE INDEX IF NOT EXISTS idx_client_profiles_plan_status ON client_profiles(plan_status);

