# Corrigir Variáveis de Ambiente do Banco de Dados no Coolify

## ⚠️ Erro Atual

```
FATAL: password authentication failed for user "postgres"
```

Isso significa que a senha do PostgreSQL configurada no Coolify está incorreta.

## 🔧 Como Corrigir

### 1. Acesse as Variáveis de Ambiente no Coolify

1. No Coolify, vá para o projeto **tradernex**
2. Clique em **Configuration** (ou **Configuração**)
3. Procure por **Environment Variables** (ou **Variáveis de Ambiente**)
4. Ou vá em **Shared Variables** se as variáveis estão compartilhadas

### 2. Verifique/Configure as Variáveis do Banco de Dados

Certifique-se de que as seguintes variáveis estão configuradas corretamente:

```env
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha_correta_do_postgres
DB_NAME=tradernex
```

### 3. Como Descobrir a Senha Correta

#### Opção A: Se você tem acesso ao servidor PostgreSQL

1. Conecte-se ao servidor onde o PostgreSQL está rodando
2. Acesse o terminal do container/servidor PostgreSQL
3. Execute:
   ```bash
   psql -U postgres
   ```
4. Se pedir senha, essa é a senha que você precisa usar no `DB_PASSWORD`

#### Opção B: Verificar no Coolify

1. No Coolify, vá para o serviço do PostgreSQL (se estiver gerenciado pelo Coolify)
2. Verifique as variáveis de ambiente do serviço PostgreSQL
3. Procure por `POSTGRES_PASSWORD` ou similar
4. Use essa senha no `DB_PASSWORD` do seu serviço backend

#### Opção C: Resetar a Senha do PostgreSQL

Se você não sabe a senha, pode resetá-la:

1. Acesse o terminal do container/servidor PostgreSQL no Coolify
2. Execute:
   ```bash
   psql -U postgres
   ```
3. Se não conseguir, tente:
   ```bash
   docker exec -it nome_do_container_postgres psql -U postgres
   ```
4. Dentro do psql, execute:
   ```sql
   ALTER USER postgres WITH PASSWORD 'nova_senha_aqui';
   ```
5. Use essa nova senha no `DB_PASSWORD`

### 4. Verificar o Host do Banco

O `DB_HOST` deve ser:

- Se o PostgreSQL está no mesmo servidor: `localhost` ou o nome do serviço no Docker
- Se está em outro servidor: o IP ou hostname do servidor PostgreSQL
- Se está em um container Docker no Coolify: geralmente é o nome do serviço (ex: `postgres`, `db`, `postgresql`)

### 5. Após Configurar

1. **Salve** as variáveis de ambiente no Coolify
2. **Redeploy** o serviço backend para aplicar as mudanças
3. Verifique os logs novamente - o erro deve desaparecer

## 📋 Checklist

- [ ] `DB_HOST` está correto (hostname ou IP do PostgreSQL)
- [ ] `DB_PORT` está correto (geralmente `5432`)
- [ ] `DB_USER` está correto (geralmente `postgres`)
- [ ] `DB_PASSWORD` está correto (senha do PostgreSQL)
- [ ] `DB_NAME` está correto (geralmente `tradernex`)
- [ ] Variáveis foram salvas no Coolify
- [ ] Serviço backend foi redeployado

## 🔍 Verificar se Funcionou

Após o redeploy, verifique os logs do backend. Você deve ver:

```
✅ Conectado ao banco de dados PostgreSQL
```

Ao invés de:

```
FATAL: password authentication failed
```

## 💡 Dica

Se você não tem certeza das credenciais, pode criar um novo usuário no PostgreSQL especificamente para o TraderNex:

```sql
-- Conecte-se como postgres
psql -U postgres

-- Crie um novo usuário
CREATE USER tradernex_user WITH PASSWORD 'senha_segura_aqui';

-- Dê permissões no banco
GRANT ALL PRIVILEGES ON DATABASE tradernex TO tradernex_user;

-- Se o banco já existe, conecte-se a ele e dê permissões nas tabelas
\c tradernex
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradernex_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradernex_user;
```

Depois use:
- `DB_USER=tradernex_user`
- `DB_PASSWORD=senha_segura_aqui`
