-- Migração: Adicionar coluna is_admin na tabela users
-- Data: 2024

-- Adicionar coluna para identificar administradores
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_admin IS 'Indica se o usuário é administrador';

-- Criar índice para melhorar performance em consultas de admin
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

