-- Migração: Adicionar tabela myfxbook_connections
-- Data: 2025-01-15

-- Tabela de Conexões Myfxbook
CREATE TABLE IF NOT EXISTS myfxbook_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_myfxbook_connections_user_id ON myfxbook_connections(user_id);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_myfxbook_connections_updated_at ON myfxbook_connections;
CREATE TRIGGER update_myfxbook_connections_updated_at BEFORE UPDATE ON myfxbook_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

