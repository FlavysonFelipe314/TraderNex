-- Tabela de Interessados em Cripto
CREATE TABLE IF NOT EXISTS crypto_interested (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) -- Um usuário só pode se registrar uma vez
);

-- Comentários
COMMENT ON TABLE crypto_interested IS 'Usuários interessados em ser avisados sobre o lançamento do módulo de Cripto Futures';
COMMENT ON COLUMN crypto_interested.user_id IS 'ID do usuário que se interessou (pode ser NULL se não estiver logado)';
COMMENT ON COLUMN crypto_interested.email IS 'Email do interessado';
COMMENT ON COLUMN crypto_interested.notified IS 'Indica se o usuário já foi notificado sobre o lançamento';
COMMENT ON COLUMN crypto_interested.notified_at IS 'Data e hora em que o usuário foi notificado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_crypto_interested_user_id ON crypto_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_email ON crypto_interested(email);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_created_at ON crypto_interested(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_notified ON crypto_interested(notified);
