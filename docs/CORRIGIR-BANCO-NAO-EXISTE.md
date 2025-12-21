# 🔧 Corrigir Erro: database "tradernex" does not exist

## 🚨 Problema

Os logs mostram repetidos erros:
```
FATAL: database "tradernex" does not exist
```

Isso causa erros 500 em todas as APIs que tentam acessar o banco de dados:
- `/api/auth/login` - Erro 500
- `/api/dashboard/investment-plans` - Erro 500
- `/api/dashboard/mt4-accounts` - Erro 500
- `/api/dashboard/myfxbook-data` - Erro 500
- `/api/dashboard/overview` - Erro 500
- `/api/dashboard/performance` - Erro 500

## ✅ Solução Implementada

Foi modificado o `docker-entrypoint.sh` para:

1. **Verificar se o PostgreSQL está pronto** conectando ao banco padrão `postgres`
2. **Criar o banco de dados `tradernex` automaticamente** se ele não existir
3. **Inicializar o banco** (criar tabelas) se necessário

### Arquivos Modificados

1. **`backend/docker-entrypoint.sh`**
   - Adicionada função para criar o banco de dados se não existir
   - Melhor tratamento de erros durante a inicialização

2. **`backend/src/config/createDatabase.js`** (NOVO)
   - Script auxiliar para criar o banco de dados manualmente
   - Pode ser executado independentemente se necessário

3. **`backend/package.json`**
   - Adicionado script `create-db` para criar o banco manualmente
   - Script `init-db` agora cria o banco antes de inicializar

## 🚀 Como Usar

### Opção 1: Automático (Recomendado)

O banco será criado automaticamente na próxima inicialização do container backend.

**No Docker Compose:**
```bash
docker-compose restart backend
```

**No Coolify:**
1. Vá em **Deployments**
2. Clique em **Redeploy** no serviço backend
3. Aguarde a reinicialização

### Opção 2: Manual (Local ou se necessário)

#### Usando npm script:
```bash
cd backend
npm run create-db
```

#### Executando diretamente:
```bash
cd backend
node src/config/createDatabase.js
```

#### Usando Docker (se o banco está em container):
```bash
# Criar banco via psql no container
docker-compose exec db psql -U postgres -c "CREATE DATABASE tradernex;"
```

## 🔍 Verificar se Funcionou

Após a reinicialização, os logs do backend devem mostrar:

```
🔄 Aguardando PostgreSQL estar pronto...
✅ PostgreSQL está pronto!
🔍 Verificando se o banco de dados 'tradernex' existe...
📦 Criando banco de dados "tradernex"...
✅ Banco de dados criado com sucesso!
✅ Banco de dados 'tradernex' está disponível
🔍 Verificando se o banco de dados precisa ser inicializado...
🔄 Inicializando banco de dados...
✅ Schema do banco de dados criado com sucesso!
✅ Banco de dados inicializado com sucesso!
🚀 Iniciando servidor...
```

Os erros 500 devem desaparecer e as APIs devem funcionar normalmente.

## ⚠️ Notas Importantes

1. **Variáveis de Ambiente**: Certifique-se de que as seguintes variáveis estão configuradas corretamente:
   ```env
   DB_HOST=db  # ou o host do PostgreSQL
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui
   DB_NAME=tradernex
   ```

2. **Docker Compose**: Se você estiver usando Docker Compose local, o `POSTGRES_DB` no `docker-compose.yaml` deve criar o banco automaticamente na primeira inicialização. Se o volume já existir sem o banco, você pode:
   - Deletar o volume: `docker-compose down -v` (⚠️ **isso apaga todos os dados!**)
   - Ou usar o script para criar o banco

3. **Coolify/Produção**: Em produção, se o banco não foi criado automaticamente pelo PostgreSQL, o script agora criará na próxima reinicialização do backend.

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do backend:**
   ```bash
   docker-compose logs backend
   # ou no Coolify: veja os logs do serviço backend
   ```

2. **Teste a conexão manualmente:**
   ```bash
   # No container do backend
   docker-compose exec backend node -e "
   const {Pool} = require('pg');
   const p = new Pool({
     host: process.env.DB_HOST,
     port: 5432,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: 'postgres'
   });
   p.query('SELECT datname FROM pg_database WHERE datname=\\'tradernex\\'').then(r => {
     console.log('Banco existe?', r.rows.length > 0);
     p.end();
   });
   "
   ```

3. **Verifique permissões do usuário PostgreSQL:**
   - O usuário `DB_USER` precisa ter permissão para criar bancos de dados
   - Se necessário, execute no PostgreSQL:
     ```sql
     ALTER USER postgres CREATEDB;
     ```
