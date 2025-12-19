# Aplicar Migration: Tabela de Interessados em Cripto

Este documento explica como aplicar a migration para criar a tabela `crypto_interested` no banco de dados.

## Arquivo de Migration

O arquivo está localizado em:
```
backend/src/config/migrations/add_crypto_interested_table.sql
```

## Método 1: Via Terminal do Coolify (Recomendado)

1. Acesse o terminal do container do backend no Coolify
2. Execute o seguinte comando:

```bash
psql -U postgres -d tradernex -f /usr/src/app/src/config/migrations/add_crypto_interested_table.sql
```

**OU** copie e cole o conteúdo do arquivo SQL diretamente no terminal `psql`:

```bash
psql -U postgres -d tradernex
```

Depois cole o conteúdo completo do arquivo `add_crypto_interested_table.sql`.

## Método 2: Via SQL Direto

Se você tiver acesso direto ao banco de dados PostgreSQL, execute o seguinte SQL:

```sql
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

-- Constraint única para user_id (apenas quando não for NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_interested_user_id_unique 
ON crypto_interested(user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_interested_email_unique 
ON crypto_interested(email);

-- Comentários
COMMENT ON TABLE crypto_interested IS 'Usuários interessados em ser avisados sobre o lançamento do módulo de Cripto Futures';
COMMENT ON COLUMN crypto_interested.user_id IS 'ID do usuário que se interessou (pode ser NULL se não estiver logado)';
COMMENT ON COLUMN crypto_interested.email IS 'Email do interessado';
COMMENT ON COLUMN crypto_interested.notified IS 'Indica se o usuário já foi notificado sobre o lançamento';
COMMENT ON COLUMN crypto_interested.notified_at IS 'Data e hora em que o usuário foi notificado';

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_crypto_interested_user_id ON crypto_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_email ON crypto_interested(email);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_created_at ON crypto_interested(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_interested_notified ON crypto_interested(notified);
```

## Verificação

Após aplicar a migration, verifique se a tabela foi criada:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'crypto_interested';
```

Se retornar `crypto_interested`, a tabela foi criada com sucesso!

## Próximos Passos

Após aplicar a migration, o sistema de interessados em cripto estará totalmente funcional:
- Usuários podem clicar em "Quero ser avisado" na página CriptoEmBrevePage
- Admins podem ver todos os interessados em `/admin/crypto-interested`
- Admins podem marcar interessados como notificados
