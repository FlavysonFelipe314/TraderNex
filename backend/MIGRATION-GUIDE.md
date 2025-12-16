# 📋 Guia de Migração - Tabela Myfxbook

Este guia explica como executar a migração para adicionar a tabela `myfxbook_connections` ao banco de dados.

## 🎯 Opção 1: Usando o Script NPM (Recomendado)

A forma mais fácil é usar o script que criamos:

```bash
cd backend
npm run migrate
```

Este comando irá:
- ✅ Ler o arquivo de migração SQL
- ✅ Executar no banco de dados
- ✅ Mostrar mensagens de sucesso/erro
- ✅ Tratar caso a tabela já exista

## 🎯 Opção 2: Executar Diretamente com Node.js

```bash
cd backend
node src/config/runMigration.js
```

## 🎯 Opção 3: Executar SQL Diretamente no PostgreSQL

Se preferir executar manualmente:

### Via psql (linha de comando):

```bash
# Conectar ao PostgreSQL
psql -U postgres -d tradernex

# Depois execute o conteúdo do arquivo:
\i backend/src/config/migrations/add_myfxbook_table.sql

# Ou copie e cole o SQL diretamente no psql
```

### Via pgAdmin ou outro cliente gráfico:

1. Abra o pgAdmin ou seu cliente PostgreSQL favorito
2. Conecte ao banco `tradernex`
3. Abra o arquivo `backend/src/config/migrations/add_myfxbook_table.sql`
4. Execute o SQL

## 🎯 Opção 4: Se estiver usando Docker

Se você está usando Docker Compose:

```bash
# Executar migração dentro do container do backend
docker-compose exec backend npm run migrate

# Ou diretamente com node
docker-compose exec backend node src/config/runMigration.js
```

## ✅ Verificar se a Migração Funcionou

Para verificar se a tabela foi criada:

```sql
-- Conecte ao PostgreSQL
psql -U postgres -d tradernex

-- Verificar se a tabela existe
\dt myfxbook_connections

-- Ver estrutura da tabela
\d myfxbook_connections
```

Ou via Node.js:

```bash
cd backend
node -e "const pool = require('./src/config/database'); pool.query('SELECT * FROM myfxbook_connections LIMIT 1').then(() => console.log('✅ Tabela existe!')).catch(e => console.log('❌ Erro:', e.message)).finally(() => process.exit())"
```

## 🔄 Se a Tabela Já Existir

O script trata automaticamente se a tabela já existir. Você verá a mensagem:

```
ℹ️  Tabela myfxbook_connections já existe. Nenhuma ação necessária.
```

Isso não é um erro - significa que a migração já foi executada anteriormente.

## 🆘 Problemas Comuns

### Erro: "relation already exists"
- ✅ Normal se a tabela já foi criada
- O script trata isso automaticamente

### Erro: "connect ECONNREFUSED"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`

### Erro: "permission denied"
- Verifique se o usuário do banco tem permissões
- Tente executar como usuário `postgres` ou com permissões adequadas

## 📝 Conteúdo da Migração

A migração cria:
- Tabela `myfxbook_connections` com campos:
  - `id` (UUID, chave primária)
  - `user_id` (UUID, referência a users)
  - `email` (VARCHAR)
  - `session_id` (VARCHAR)
  - `connected_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
- Índice em `user_id`
- Trigger para atualizar `updated_at` automaticamente

## 🚀 Próximos Passos

Após executar a migração:
1. Reinicie o servidor backend (se estiver rodando)
2. Teste a conexão Myfxbook na interface
3. Acesse `http://localhost:3000/conta-forex-mt4`
4. Clique em "Conectar Myfxbook"

