# 🚨 EXECUTAR MIGRAÇÃO AGORA

## Problema Identificado

O erro 500 acontece porque a tabela `myfxbook_connections` não existe no banco de dados.

## ✅ Solução Rápida

### Opção 1: Executar Migração no Docker (Recomendado)

```powershell
# 1. Certifique-se que o Docker está rodando
docker-compose ps

# 2. Execute a migração dentro do container
docker-compose exec backend npm run migrate
```

### Opção 2: Executar Migração Localmente

Se você tem PostgreSQL rodando localmente:

```powershell
cd backend
npm run migrate
```

### Opção 3: Criar Tabela Manualmente (SQL)

Conecte ao PostgreSQL e execute:

```sql
-- Conectar ao banco
psql -U postgres -d tradernex

-- Executar SQL
CREATE TABLE IF NOT EXISTS myfxbook_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_myfxbook_connections_user_id 
ON myfxbook_connections(user_id);
```

## ✅ Verificar se Funcionou

Depois de executar a migração:

1. Tente conectar Myfxbook novamente no frontend
2. Verifique os logs do backend:
   ```powershell
   docker-compose logs -f backend
   ```
3. Se ainda der erro, verifique se a tabela foi criada:
   ```powershell
   docker-compose exec backend node -e "const pool = require('./src/config/database'); pool.query('SELECT * FROM myfxbook_connections LIMIT 1').then(() => console.log('✅ Tabela existe!')).catch(e => console.log('❌ Erro:', e.message)).finally(() => process.exit())"
   ```

## 🔧 Correção Automática Aplicada

Adicionei código no controller que tenta criar a tabela automaticamente se ela não existir. Mas é melhor executar a migração oficial para garantir que tudo está correto.

## 📝 Próximos Passos

1. Execute a migração (escolha uma das opções acima)
2. Recarregue a página do frontend
3. Tente conectar Myfxbook novamente
4. O erro 500 deve desaparecer

