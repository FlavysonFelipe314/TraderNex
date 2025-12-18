# Aplicar Migration - System MyFXBook Config

## ⚠️ IMPORTANTE: Conecte-se ao banco correto!

Primeiro, conecte-se ao banco de dados `tradernex`:

```bash
psql -U postgres -d tradernex
```

Ou dentro do psql:

```sql
\c tradernex
```

## Comandos SQL para executar

Execute os seguintes comandos:

```sql
-- Criar tabela para configurações do sistema MyFXBook
-- Usando gen_random_uuid() que não requer extensão adicional
CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Adicionar comentário
COMMENT ON TABLE system_myfxbook_config IS 'Credenciais padrão do sistema para login no MyFXBook';
```

## Alternativa se gen_random_uuid() não funcionar

Se `gen_random_uuid()` também não funcionar, use esta versão sem DEFAULT:

```sql
CREATE TABLE IF NOT EXISTS system_myfxbook_config (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE system_myfxbook_config IS 'Credenciais padrão do sistema para login no MyFXBook';
```

Neste caso, os UUIDs serão gerados no código da aplicação.

## Verificar se foi criado

Para verificar se a tabela foi criada corretamente:

```sql
-- Verificar se a tabela existe
\dt system_myfxbook_config

-- Ver estrutura da tabela
\d system_myfxbook_config
```

## Nota

Se você já tiver a extensão `uuid-ossp` habilitada, pode pular o primeiro comando. O `CREATE EXTENSION IF NOT EXISTS` é seguro e não causará erro se a extensão já existir.
