-- Migration: Adicionar campo de lucro na tabela invoices
-- Data: 2025-01-XX

-- Adicionar campo para armazenar o lucro que gerou a fatura
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS fee_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_invoices_profit_amount ON invoices(profit_amount);
