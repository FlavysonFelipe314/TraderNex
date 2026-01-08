# 🌱 Como Executar Seeds - TraderNex

Este guia explica como popular o banco de dados com dados iniciais (seeds) para testes e desenvolvimento.

## 📋 O que são Seeds?

Seeds são dados iniciais inseridos no banco de dados para:
- ✅ Testar a aplicação com dados realistas
- ✅ Desenvolvimento local com dados pré-configurados
- ✅ Demonstrações da aplicação
- ✅ Testes de funcionalidades

## 📊 O que é Inserido pelo Seed

O seed do TraderNex insere os seguintes dados:

### 👤 Usuários de Teste (5 usuários)

1. **Admin**
   - Email: `admin@tradernex.com`
   - Senha: `senha123`
   - Tipo: Admin/Premium

2. **João Silva**
   - Email: `joao.silva@email.com`
   - Senha: `senha123`
   - Tipo: Pro

3. **Maria Santos**
   - Email: `maria.santos@email.com`
   - Senha: `senha123`
   - Tipo: Basic

4. **Pedro Oliveira**
   - Email: `pedro.oliveira@email.com`
   - Senha: `senha123`
   - Tipo: Basic

5. **Ana Costa**
   - Email: `ana.costa@email.com`
   - Senha: `senha123`
   - Tipo: Pro

### 📦 Outros Dados Inseridos

- **Perfis de Cliente** - 5 perfis com saldos e investimentos
- **Planos de Investimento** - 3 planos (Nex Start, Nex Pro, Nex Prime)
- **Contas MT4** - 5 contas MT4 de exemplo
- **Investimentos** - Investimentos ativos e completos
- **Transações** - Depósitos, saques, lucros, bônus
- **Faturas** - Faturas pagas, pendentes e vencidas
- **Relatórios de Performance** - Relatórios de 7 e 14 dias
- **Referências** - Relacionamentos de indicação entre usuários
- **Tickets de Suporte** - Tickets de exemplo com diferentes status
- **Respostas de Suporte** - Respostas para alguns tickets

---

## 🎯 Método 1: Via NPM Script (Recomendado)

### Executar Seed

```bash
# Dentro do container backend ou no diretório backend local
npm run seed
```

Este comando executa o script `src/config/seed.js` que popula o banco com todos os dados iniciais.

---

## 🐳 Método 2: Via Docker Compose

Se você está usando Docker Compose:

```bash
# Executar seed
docker-compose exec backend npm run seed

# Ou diretamente com node
docker-compose exec backend node src/config/seed.js
```

---

## ⚠️ Ordem de Execução

### 1. Primeiro: Criar o Banco e Schema

```bash
# Criar banco de dados (se não existir)
npm run create-db

# Inicializar schema (criar tabelas)
npm run init-db
```

### 2. Depois: Executar Migrations (se necessário)

```bash
npm run migrate
npm run migrate:selected-plan
```

### 3. Por fim: Executar Seeds

```bash
npm run seed
```

---

## 🔍 Verificar se Seed Foi Aplicado

### Verificar Usuários

```sql
-- Conectar ao PostgreSQL
psql -U postgres -d tradernex

-- Ver usuários inseridos
SELECT id, email, first_name, last_name, is_active 
FROM users 
ORDER BY created_at;

-- Verificar usuário admin
SELECT email, is_admin FROM users WHERE email = 'admin@tradernex.com';

-- Sair
\q
```

### Verificar Planos de Investimento

```sql
SELECT id, name, min_investment, max_investment, expected_return 
FROM investment_plans 
ORDER BY min_investment;
```

### Verificar Contas MT4

```sql
SELECT u.email, m.account_number, m.broker, m.balance, m.status
FROM mt4_accounts m
JOIN users u ON m.user_id = u.id
ORDER BY u.email;
```

### Verificar Investimentos

```sql
SELECT u.email, ip.name as plan, ui.amount, ui.status, ui.profit
FROM user_investments ui
JOIN users u ON ui.user_id = u.id
JOIN investment_plans ip ON ui.plan_id = ip.id
ORDER BY u.email;
```

### Verificar Transações

```sql
SELECT u.email, t.type, t.amount, t.status, t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC
LIMIT 10;
```

---

## 🔐 Credenciais de Teste

Após executar o seed, você pode fazer login com estas credenciais:

```
Email: admin@tradernex.com
Senha: senha123
```

```
Email: joao.silva@email.com
Senha: senha123
```

```
Email: maria.santos@email.com
Senha: senha123
```

```
Email: pedro.oliveira@email.com
Senha: senha123
```

```
Email: ana.costa@email.com
Senha: senha123
```

---

## 🆘 Solução de Problemas

### Erro: "relation does not exist"

**Causa:** Tabelas não foram criadas ainda.

**Solução:** Execute primeiro:
```bash
npm run init-db
```

### Erro: "duplicate key value violates unique constraint"

**Causa:** Os dados já foram inseridos anteriormente.

**Solução:** Isso é normal! O seed usa `ON CONFLICT DO NOTHING`, então não insere duplicatas. Os dados existentes não são alterados.

### Seed não inseriu todos os dados

**Causa:** Pode haver dependências que falharam.

**Solução:** 
1. Verifique os logs do seed para ver onde falhou
2. Certifique-se de que todas as migrations foram aplicadas
3. Execute o seed novamente (é seguro, não cria duplicatas)

---

## 🔄 Re-executar Seeds

O seed é **idempotente** (pode ser executado múltiplas vezes):

- ✅ Usa `ON CONFLICT DO NOTHING` para evitar duplicatas
- ✅ Não apaga dados existentes
- ✅ Apenas adiciona dados que não existem
- ✅ Atualiza planos de investimento se já existirem

Você pode executar `npm run seed` quantas vezes quiser sem problemas.

---

## 🗑️ Limpar Dados (Opcional)

⚠️ **CUIDADO:** Isso apaga TODOS os dados do banco!

Se você quiser limpar os dados antes de executar o seed novamente, você pode descomentar a linha no arquivo `seed.js`:

```javascript
// Descomentar esta linha em seed.js:
await pool.query('TRUNCATE TABLE support_responses, support_tickets, referrals, performance_reports, invoices, transactions, user_investments, mt4_accounts, client_profiles, users CASCADE;');
```

Ou executar manualmente via SQL:

```sql
-- ⚠️ ATENÇÃO: Isso apaga TODOS os dados!
TRUNCATE TABLE support_responses, support_tickets, referrals, 
              performance_reports, invoices, transactions, 
              user_investments, mt4_accounts, client_profiles, 
              users CASCADE;
```

---

## 📝 Customizar Seeds

Se você quiser modificar os dados inseridos pelo seed:

1. Edite o arquivo `backend/src/config/seed.js`
2. Modifique os valores conforme necessário
3. Execute novamente: `npm run seed`

**Exemplo:** Para mudar a senha padrão dos usuários, altere a linha:

```javascript
const hashedPassword = await bcrypt.hash('sua_nova_senha_aqui', 10);
```

---

## ✅ Checklist de Seeds

Use este checklist após executar o seed:

- [ ] Seed executado sem erros
- [ ] 5 usuários criados
- [ ] 3 planos de investimento criados
- [ ] Perfis de cliente criados
- [ ] Contas MT4 inseridas
- [ ] Investimentos criados
- [ ] Transações inseridas
- [ ] Faturas criadas
- [ ] Relatórios de performance inseridos
- [ ] Referências criadas
- [ ] Tickets de suporte inseridos
- [ ] Login funcionando com as credenciais de teste

---

## 🚀 Comando Completo (Setup Inicial)

Para fazer o setup completo do zero:

```bash
# 1. Criar banco
npm run create-db

# 2. Inicializar schema
npm run init-db

# 3. Executar migrations (se necessário)
npm run migrate
npm run migrate:selected-plan

# 4. Popular com dados iniciais
npm run seed
```

Ou tudo de uma vez (se já tiver o banco criado):

```bash
npm run init-db && npm run migrate && npm run seed
```

---

## 📚 Referências

- Arquivo de seed: `backend/src/config/seed.js`
- Schema do banco: `backend/src/config/schema.sql`
- Documentação PostgreSQL: https://www.postgresql.org/docs/






