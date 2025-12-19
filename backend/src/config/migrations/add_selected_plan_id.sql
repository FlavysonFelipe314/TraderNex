-- Adicionar coluna selected_plan_id em client_profiles
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES investment_plans(id);

-- Comentário
COMMENT ON COLUMN client_profiles.selected_plan_id IS 'Plano de investimento selecionado pelo usuário';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_selected_plan_id ON client_profiles(selected_plan_id);

