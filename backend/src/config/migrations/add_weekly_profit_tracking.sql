-- Migration: Adicionar rastreamento de lucro semanal
-- Data: 2025-01-XX

-- Adicionar campo para rastrear lucro processado na última semana
ALTER TABLE user_investments 
ADD COLUMN IF NOT EXISTS last_weekly_profit DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_weekly_processed_date TIMESTAMP;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_investments_last_weekly_processed ON user_investments(last_weekly_processed_date);
