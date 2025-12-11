# 🚀 Setup Rápido - TraderNex Backend

## Passos para Configuração

### 1️⃣ Instalar PostgreSQL

Se ainda não tiver o PostgreSQL instalado:

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Instale e configure a senha do usuário `postgres`

**Mac (com Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2️⃣ Criar Banco de Dados

Conecte ao PostgreSQL:
```bash
psql -U postgres
```

Crie o banco de dados:
```sql
CREATE DATABASE tradernex;
\q
```

### 3️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `.env` e atualize com suas credenciais do PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=tradernex
```

### 4️⃣ Inicializar o Banco de Dados

Execute o script de inicialização:

```bash
npm run init-db
```

Este comando irá:
- Criar todas as tabelas
- Criar índices
- Criar triggers
- Inserir dados iniciais (planos de investimento)

### 5️⃣ Iniciar o Servidor

```bash
npm run dev
```

O servidor estará rodando em: **http://localhost:5000**

### 6️⃣ Testar a API

Acesse o health check:
```bash
curl http://localhost:5000/health
```

Você deve receber:
```json
{
  "success": true,
  "message": "TraderNex API está funcionando!",
  "timestamp": "2024-..."
}
```

## 🔥 Pronto!

Seu backend está configurado e rodando!

### Próximos Passos:

1. **Teste os endpoints** de autenticação (registro, login)
2. **Configure o frontend** para conectar ao backend
3. **Explore a documentação** completa no README.md

## 🆘 Problemas Comuns

### Erro de conexão com PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`

### Erro "Database does not exist"

**Solução:**
```bash
createdb -U postgres tradernex
```

### Porta 5000 já em uso

**Solução:**
- Altere a variável `PORT` no arquivo `.env`
- Ou mate o processo que está usando a porta 5000

---

**Dúvidas?** Consulte o README.md completo ou abra uma issue no GitHub.
