# Resumo da Implementação - Sistema de Indicações e Faturas

## ✅ O que foi implementado

### 1. **Serviço de Comissões de Indicações** (`referralCommissionService.js`)

Implementa a lógica de cálculo de comissões conforme especificado:

- **Performance Fee da Corretora:**
  - R$ 1.000 a R$ 5.000: 50% do lucro
  - R$ 5.000 a R$ 10.000: 40% do lucro
  - R$ 10.000+: 30% do lucro

- **Comissão do Indicador:** 10% do lucro líquido da corretora

**Funções:**
- `calculateBrokerPerformanceFee()`: Calcula a taxa da corretora
- `calculateReferralCommission()`: Calcula a comissão completa
- `processReferralCommission()`: Processa e salva a comissão no banco
- `getReferralStats()`: Obtém estatísticas de comissões

### 2. **Serviço de Faturas** (`invoiceService.js`)

Gerencia faturas de performance fee que o cliente deve pagar à corretora.

**Funções:**
- `calculatePerformanceFee()`: Calcula a performance fee
- `createPerformanceInvoice()`: Cria uma fatura
- `generateWeeklyInvoices()`: Gera faturas semanais automaticamente
- `markInvoiceAsPaid()`: Marca fatura como paga
- `getPendingInvoices()`: Obtém faturas pendentes

### 3. **Serviço de Processamento de Lucros** (`profitProcessingService.js`)

Processa lucros automaticamente e calcula comissões.

**Funções:**
- `processInvestmentProfit()`: Processa lucro de investimento
- `processMT4AccountProfit()`: Processa lucro de conta MT4
- `processWeeklyProfit()`: Processa lucro semanal

### 4. **Atualização do Banco de Dados**

**Migration criada:** `add_referral_commission_details.sql`

**Campos adicionados à tabela `referrals`:**
- `investment_amount`: Valor do investimento
- `profit_amount`: Lucro total gerado
- `broker_fee_percentage`: Percentual da taxa da corretora
- `broker_profit`: Lucro da corretora
- `last_commission_date`: Data da última comissão
- `updated_at`: Data da última atualização

**Índices adicionados:**
- `idx_referrals_last_commission_date`: Para consultas por data

**Trigger adicionado:**
- `update_referrals_updated_at`: Atualiza `updated_at` automaticamente

### 5. **Endpoints da API**

**Novos endpoints:**

1. `POST /api/dashboard/process-investment-profit`
   - Processa lucro de investimento e calcula comissões

2. `POST /api/dashboard/process-mt4-profit`
   - Processa lucro de conta MT4

3. `POST /api/dashboard/invoices/create`
   - Cria uma fatura de performance

4. `POST /api/dashboard/invoices/generate-weekly`
   - Gera faturas semanais

5. `POST /api/dashboard/invoices/mark-paid`
   - Marca fatura como paga

**Endpoints atualizados:**

1. `GET /api/dashboard/referrals`
   - Agora retorna informações detalhadas incluindo:
     - Estatísticas de comissões
     - Detalhes de cada indicação (investimento, lucro, taxa, etc.)
     - Comissão disponível para saque

2. `GET /api/dashboard/invoices`
   - Agora retorna totais (total, pendente, pago, vencido)

### 6. **Documentação**

- `SISTEMA-INDICACOES-FATURAS.md`: Documentação completa do sistema
- `RESUMO-IMPLEMENTACAO-INDICACOES-FATURAS.md`: Este resumo

## 📋 Como usar

### Passo 1: Executar Migration

```bash
node backend/src/config/runMigrationReferralDetails.js
```

### Passo 2: Processar Lucros

Quando um investimento ou conta MT4 gera lucro:

```javascript
// Para investimento
POST /api/dashboard/process-investment-profit
{
  "investmentId": "uuid",
  "newProfit": 2000.00,
  "previousProfit": 1000.00
}

// Para conta MT4
POST /api/dashboard/process-mt4-profit
{
  "mt4AccountId": "uuid",
  "profit": 1500.00,
  "investmentAmount": 5000.00
}
```

O sistema automaticamente:
- ✅ Calcula a performance fee da corretora
- ✅ Calcula e atribui a comissão ao indicador (10% do lucro da corretora)
- ✅ Cria transações apropriadas
- ✅ Atualiza saldos dos usuários

### Passo 3: Gerar Faturas

```javascript
// Gerar faturas semanais
POST /api/dashboard/invoices/generate-weekly
{
  "weekStart": "2025-01-01",
  "weekEnd": "2025-01-07"
}
```

## 🎯 Exemplo Prático

**Cenário:**
- Usuário A indica Usuário B
- Usuário B investe R$ 1.000
- Usuário B ganha R$ 2.000 (lucro de R$ 1.000)

**Processamento:**

1. Sistema calcula:
   - Performance Fee: 50% de R$ 1.000 = R$ 500 (corretora)
   - Lucro do Cliente: R$ 1.500
   - Comissão do Indicador: 10% de R$ 500 = R$ 50

2. Sistema executa:
   - Cria/atualiza registro em `referrals` com comissão de R$ 50
   - Cria transação de `referral_bonus` para Usuário A
   - Atualiza saldo de Usuário A (+R$ 50)
   - Cria fatura de performance fee de R$ 500 para Usuário B

## 📊 Estrutura de Arquivos Criados/Modificados

### Novos Arquivos:
- `backend/src/services/referralCommissionService.js`
- `backend/src/services/invoiceService.js`
- `backend/src/services/profitProcessingService.js`
- `backend/src/config/migrations/add_referral_commission_details.sql`
- `backend/src/config/runMigrationReferralDetails.js`
- `docs/SISTEMA-INDICACOES-FATURAS.md`
- `docs/RESUMO-IMPLEMENTACAO-INDICACOES-FATURAS.md`

### Arquivos Modificados:
- `backend/src/controllers/dashboardController.js`
- `backend/src/routes/dashboardRoutes.js`
- `backend/src/config/schema.sql`

## ⚠️ Próximos Passos Recomendados

1. **Integração com MyFXBook:**
   - Criar job/cron para sincronizar lucros semanalmente
   - Processar lucros automaticamente quando detectados

2. **Notificações:**
   - Enviar email quando comissão for creditada
   - Enviar email quando fatura for gerada

3. **Dashboard Admin:**
   - Visualizar todas as comissões pendentes
   - Aprovar/rejeitar saques de comissões
   - Gerenciar faturas

4. **Testes:**
   - Criar testes unitários para os serviços
   - Criar testes de integração para os endpoints

## 🔍 Validações Implementadas

- ✅ Lucros negativos não geram comissões
- ✅ Faturas só são criadas se houver lucro positivo
- ✅ Usuários só podem marcar suas próprias faturas como pagas
- ✅ Comissões são acumulativas (somadas ao total existente)
- ✅ Transações são atômicas (rollback em caso de erro)

## 📝 Notas Importantes

1. **Comissões são acumulativas:** Cada lucro adiciona ao total do indicador
2. **Performance Fee é calculada sobre o lucro líquido:** (ganho total - investimento inicial)
3. **Faturas são independentes:** Representam o que o cliente deve pagar, não afetam comissões diretamente
4. **Todas as operações são transacionais:** Garantem consistência dos dados
