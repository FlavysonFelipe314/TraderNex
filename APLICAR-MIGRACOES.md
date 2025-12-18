# 🚀 Como Aplicar as Migrations

Este guia mostra como aplicar as migrations do banco de dados PostgreSQL.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Containers rodando (`docker-compose up -d`)
- Arquivo `MIGRACOES-SIMPLES.sql` na raiz do projeto

---

## 🎯 Método 1: Via PowerShell (Recomendado - Windows)

### Passo 1: Verificar se os containers estão rodando

```powershell
docker-compose ps
```

Você deve ver os containers `db` (ou `postgres`) e `backend` rodando.

### Passo 2: Executar as migrations

**Opção A: Executar arquivo SQL diretamente (Mais fácil)**

```powershell
Get-Content MIGRACOES-SIMPLES.sql | docker-compose exec -T db psql -U postgres -d tradernex
```

**Opção B: Entrar no psql e executar manualmente**

1. Entrar no psql:
```powershell
docker-compose exec db psql -U postgres -d tradernex
```

2. Você verá o prompt: `tradernex=#`

3. Abra o arquivo `MIGRACOES-SIMPLES.sql` no editor de texto

4. Copie TODO o conteúdo (Ctrl + A, Ctrl + C)

5. Cole no terminal do psql (botão direito → Colar ou Shift + Insert)

6. Pressione Enter

7. Você deve ver mensagens como:
   ```
   ALTER TABLE
   CREATE INDEX
   ALTER TABLE
   UPDATE 1
   ```

8. Para sair do psql, digite: `\q` e pressione Enter

---

## 🐧 Método 2: Via Bash (Linux/Mac)

### Passo 1: Verificar containers

```bash
docker-compose ps
```

### Passo 2: Executar migrations

**Opção A: Executar arquivo SQL diretamente**

```bash
cat MIGRACOES-SIMPLES.sql | docker-compose exec -T db psql -U postgres -d tradernex
```

**Opção B: Entrar no psql**

```bash
docker-compose exec db psql -U postgres -d tradernex
```

Depois, copie e cole o conteúdo do arquivo `MIGRACOES-SIMPLES.sql`.

---

## ✅ Verificar se Funcionou

Execute estes comandos para verificar:

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';"
```

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'mt4_accounts' AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');"
```

```powershell
docker-compose exec db psql -U postgres -d tradernex -c "SELECT email, is_admin FROM users WHERE is_admin = TRUE;"
```

Se tudo estiver correto, você verá:
- ✅ Coluna `is_admin` na tabela `users`
- ✅ Colunas `myfxbook_integration_login`, `automation_enabled`, `risk_profile` na tabela `mt4_accounts`
- ✅ Usuário com `is_admin = TRUE` (se o email `admin@tradernex.com` existir)

---

## 🔧 Se o Nome do Serviço for Diferente

Se no seu `docker-compose.yaml` o serviço do banco não se chama `db`, ajuste o comando:

**Exemplo se o serviço se chama `postgres`:**
```powershell
Get-Content MIGRACOES-SIMPLES.sql | docker-compose exec -T postgres psql -U postgres -d tradernex
```

**Para descobrir o nome do serviço:**
```powershell
docker-compose ps
```

Procure pelo serviço que roda a imagem `postgres`.

---

## 🆘 Problemas Comuns

### Erro: "could not connect to server"

**Solução:** Verifique se o container está rodando:
```powershell
docker-compose ps
```

Se não estiver, inicie:
```powershell
docker-compose up -d
```

### Erro: "database tradernex does not exist"

**Solução:** Crie o banco de dados primeiro:
```powershell
docker-compose exec db psql -U postgres -c "CREATE DATABASE tradernex;"
```

### Erro: "permission denied"

**Solução:** Verifique se está usando o usuário correto (`postgres`):
```powershell
docker-compose exec db psql -U postgres -d tradernex
```

---

## 📝 O Que as Migrations Fazem?

1. **Adiciona coluna `is_admin`** na tabela `users` (para identificar administradores)
2. **Cria índice** para melhorar performance de consultas por `is_admin`
3. **Adiciona coluna `myfxbook_integration_login`** na tabela `mt4_accounts` (login MyFXBook configurado pelo admin)
4. **Adiciona coluna `automation_enabled`** na tabela `mt4_accounts` (controla trading automatizado)
5. **Adiciona coluna `risk_profile`** na tabela `mt4_accounts` (perfil de risco: conservador, moderado, agressivo)
6. **Define usuário admin** (marca usuário com email `admin@tradernex.com` como admin)

---

## ✨ Pronto!

Após aplicar as migrations, você pode:
- ✅ Acessar o painel admin (se você for admin)
- ✅ Configurar login MyFXBook para usuários
- ✅ Controlar trading automatizado e perfil de risco
