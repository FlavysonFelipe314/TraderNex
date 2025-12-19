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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraint ?nica para user_id (apenas quando n?o for NULL)
-- Para email, tamb?m garantimos unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_interested_user_id_unique 
ON crypto_interested(user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_interested_email_unique 
ON crypto_interested(email);

-- Coment?rios
COMMENT ON TABLE crypto_interested IS 'Usu?rios interessados em ser avisados sobre o lan?amento do m?dulo de Cripto Futures';
COMMENT ON COLUMN crypto_interested.user_id IS 'ID do usu?rio que se interessou (pode ser NULL se n?o estiver logado)';
COMMENT ON COLUMN crypto_interested.email IS 'Email do interessado';
COMMENT ON COLUMN crypto_interested.notified IS 'Indica se o usu?rio j? foi notificado sobre o lan?amento';
COMMENT ON COLUMN crypto_interested.notified_at IS 'Data e hora em que o usu?rio foi notificado';

-- ?ndices
CREATE INDEX IF NOT EXISTS idx_crypto_interested_user_id ON crypto_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_email ON crypto_interested(email);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_created_at ON crypto_interested(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_notified ON crypto_interested(notified);
