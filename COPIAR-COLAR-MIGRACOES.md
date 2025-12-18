# 📋 Comandos SQL para Copiar e Colar

## 🎯 Opção 1: Versão Simples (Recomendada)

Copie e cole tudo isso no psql:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
```

---

## 📝 Como Usar

### Passo 1: Acessar o psql

```powershell
docker-compose exec db psql -U postgres -d tradernex
```

Você deve ver: `tradernex=#`

### Passo 2: Copiar e Colar

1. Abra o arquivo `MIGRACOES-SIMPLES.sql`
2. Selecione tudo (`Ctrl + A`)
3. Copie (`Ctrl + C`)
4. Cole no terminal do psql (`Ctrl + V` ou botão direito → Colar)
5. Pressione `Enter`

### Passo 3: Sair do psql

Digite: `\q` e pressione `Enter`

---

## ✅ Verificação (Opcional)

Depois de executar, você pode verificar se deu certo:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin';
SELECT column_name FROM information_schema.columns WHERE table_name = 'mt4_accounts' AND column_name IN ('myfxbook_integration_login', 'automation_enabled', 'risk_profile');
SELECT email, is_admin FROM users WHERE is_admin = TRUE;
```

---

## 🚀 Comando Único (Sem Entrar no psql)

Se preferir executar tudo de uma vez sem entrar no psql:

```powershell
Get-Content MIGRACOES-SIMPLES.sql | docker-compose exec -T db psql -U postgres -d tradernex
```

---

## 📄 Arquivos Criados

- `MIGRACOES-SIMPLES.sql` - Versão simples (sem comentários)
- `MIGRACOES-COMPLETAS.sql` - Versão completa (com comentários e verificações)

**Use `MIGRACOES-SIMPLES.sql` para copiar e colar rapidamente!**
