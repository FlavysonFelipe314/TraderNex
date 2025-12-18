-- Adicionar tabela para configurações do sistema MyFXBook
-- Usando gen_random_uuid() que não requer extensão adicional (disponível no PostgreSQL 13+)
-- Se não funcionar, use: DEFAULT gen_random_uuid() ou remova o DEFAULT e gere UUIDs no código

CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Comentário
COMMENT ON TABLE system_myfxbook_config IS 'Credenciais padrão do sistema para login no MyFXBook';
