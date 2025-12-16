-- Adicionar coluna para armazenar senha criptografada do Myfxbook
-- Isso permite reconexão automática quando a sessão expira

ALTER TABLE myfxbook_connections 
ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- Comentário explicativo
COMMENT ON COLUMN myfxbook_connections.encrypted_password IS 'Senha do Myfxbook criptografada para reconexão automática';

