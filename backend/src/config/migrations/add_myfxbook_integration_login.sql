-- Migração: Adicionar coluna myfxbook_integration_login na tabela mt4_accounts
-- Data: 2024

-- Adicionar coluna para armazenar o login de integração MyFXBook
ALTER TABLE mt4_accounts
ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);

COMMENT ON COLUMN mt4_accounts.myfxbook_integration_login IS 'Login de integração MyFXBook configurado pelo admin';
