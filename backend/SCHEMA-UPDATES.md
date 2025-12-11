# Schema SQL - Atualizações e Melhorias

## 📋 Resumo das Atualizações

O schema.sql foi atualizado com melhorias de performance, integridade de dados e otimizações.

---

## ✅ Melhorias Implementadas

### 1. Constraints CHECK Adicionadas

#### `client_profiles`
- ✅ `balance >= 0` - Saldo não pode ser negativo
- ✅ `total_invested >= 0` - Investimento total não pode ser negativo
- ✅ `user_id UNIQUE` - Um usuário só pode ter um perfil

#### `mt4_accounts`
- ✅ `status IN ('active', 'inactive', 'suspended')` - Validação de status
- ✅ `UNIQUE(user_id, account_number)` - Evita contas MT4 duplicadas

#### `user_investments`
- ✅ `amount > 0` - Valor do investimento deve ser positivo
- ✅ `status IN ('active', 'completed', 'cancelled')` - Validação de status

#### `transactions`
- ✅ `type IN ('deposit', 'withdrawal', 'profit', 'fee', 'referral_bonus')` - Validação de tipo
- ✅ `amount != 0` - Valor não pode ser zero
- ✅ `status IN ('pending', 'completed', 'failed', 'cancelled')` - Validação de status

#### `invoices`
- ✅ `amount > 0` - Valor da fatura deve ser positivo
- ✅ `status IN ('pending', 'paid', 'overdue', 'cancelled')` - Validação de status

#### `performance_reports`
- ✅ `total_trades >= 0` - Não pode ser negativo
- ✅ `winning_trades >= 0` - Não pode ser negativo
- ✅ `losing_trades >= 0` - Não pode ser negativo
- ✅ `win_rate >= 0 AND win_rate <= 100` - Taxa de acerto entre 0-100%
- ✅ `UNIQUE(user_id, report_date)` - Um relatório por usuário por data

#### `referrals`
- ✅ `commission >= 0` - Comissão não pode ser negativa
- ✅ `status IN ('active', 'inactive')` - Validação de status
- ✅ `UNIQUE(referrer_id, referred_id)` - Evita referências duplicadas

#### `support_tickets`
- ✅ `status IN ('open', 'in_progress', 'resolved', 'closed')` - Validação de status
- ✅ `priority IN ('low', 'medium', 'high', 'urgent')` - Validação de prioridade

#### `investment_plans`
- ✅ `min_investment > 0` - Investimento mínimo deve ser positivo
- ✅ `max_investment >= min_investment` - Máximo deve ser >= mínimo
- ✅ `expected_return >= 0 AND expected_return <= 100` - Retorno entre 0-100%
- ✅ `duration_days > 0` - Duração deve ser positiva
- ✅ `risk_level IN ('Low', 'Medium', 'High')` - Validação de nível de risco

---

### 2. Índices Adicionais Criados

#### Índices Simples
- ✅ `idx_users_is_active` - Filtros por usuários ativos
- ✅ `idx_client_profiles_referral_code` - Busca rápida por código de referência
- ✅ `idx_mt4_accounts_status` - Filtros por status de conta
- ✅ `idx_user_investments_status` - Filtros por status de investimento
- ✅ `idx_user_investments_plan_id` - Joins com planos
- ✅ `idx_transactions_type` - Filtros por tipo de transação
- ✅ `idx_transactions_status` - Filtros por status de transação
- ✅ `idx_transactions_created_at` - Ordenação por data (DESC)
- ✅ `idx_invoices_status` - Filtros por status de fatura
- ✅ `idx_invoices_due_date` - Busca por data de vencimento
- ✅ `idx_performance_reports_date` - Filtros por data
- ✅ `idx_referrals_referred_id` - Busca por usuário referido
- ✅ `idx_referrals_status` - Filtros por status
- ✅ `idx_support_tickets_status` - Filtros por status de ticket
- ✅ `idx_support_tickets_priority` - Filtros por prioridade
- ✅ `idx_support_responses_ticket_id` - Joins com tickets
- ✅ `idx_password_reset_tokens_user_id` - Busca por usuário
- ✅ `idx_password_reset_tokens_expires` - Limpeza de tokens expirados

#### Índices Compostos
- ✅ `idx_mt4_accounts_user_status` - Queries por usuário + status
- ✅ `idx_transactions_user_type` - Queries por usuário + tipo
- ✅ `idx_performance_reports_user_date` - Queries por usuário + data

---

### 3. Constraints UNIQUE Adicionadas

- ✅ `client_profiles.user_id UNIQUE` - Um perfil por usuário
- ✅ `mt4_accounts(user_id, account_number) UNIQUE` - Evita contas duplicadas
- ✅ `performance_reports(user_id, report_date) UNIQUE` - Um relatório por data
- ✅ `referrals(referrer_id, referred_id) UNIQUE` - Evita referências duplicadas

---

## 📊 Estrutura Completa do Schema

### Tabelas (12)
1. `users` - Usuários do sistema
2. `client_profiles` - Perfis de clientes (com endereço)
3. `mt4_accounts` - Contas MT4
4. `investment_plans` - Planos de investimento
5. `user_investments` - Investimentos dos usuários
6. `transactions` - Transações financeiras
7. `invoices` - Faturas de performance
8. `performance_reports` - Relatórios de performance
9. `referrals` - Sistema de indicações
10. `support_tickets` - Tickets de suporte
11. `support_responses` - Respostas de tickets
12. `password_reset_tokens` - Tokens de reset de senha

### Índices (30+)
- Índices simples para campos frequentemente consultados
- Índices compostos para queries complexas
- Índices para ordenação (created_at DESC)

### Constraints
- CHECK constraints para validação de dados
- UNIQUE constraints para evitar duplicatas
- FOREIGN KEY com CASCADE para integridade referencial

### Triggers (8)
- Triggers automáticos para atualizar `updated_at` em todas as tabelas

---

## 🚀 Benefícios das Melhorias

1. **Performance**
   - Queries mais rápidas com índices otimizados
   - Índices compostos para queries complexas
   - Ordenação otimizada com índices DESC

2. **Integridade de Dados**
   - Constraints CHECK previnem dados inválidos
   - UNIQUE constraints evitam duplicatas
   - Validação no nível de banco de dados

3. **Manutenibilidade**
   - Schema bem documentado
   - Constraints claras e explícitas
   - Estrutura organizada e consistente

---

## 📝 Notas Importantes

- Todas as constraints são aplicadas no nível de banco de dados
- Os índices são criados com `IF NOT EXISTS` para evitar erros em re-execução
- Os triggers são criados com `CREATE OR REPLACE` para permitir atualizações
- O schema é idempotente - pode ser executado múltiplas vezes sem erros

---

## ✅ Status

**Schema atualizado e otimizado!** ✅

Todas as melhorias foram implementadas e testadas.
