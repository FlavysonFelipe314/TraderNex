# Sistema de Indicações e Faturas - TraderNex

## 📋 Visão Geral

Este documento descreve o sistema de indicações (referrals) e faturas de performance implementado no TraderNex.

## 🎯 Lógica de Indicações

### Cálculo da Performance Fee da Corretora

A corretora recebe uma porcentagem do lucro baseada no valor do investimento:

- **R$ 1.000 a R$ 5.000**: Corretora fica com **50%** do lucro
- **R$ 5.000 a R$ 10.000**: Corretora fica com **40%** do lucro
- **R$ 10.000 ou mais**: Corretora fica com **30%** do lucro

### Cálculo da Comissão do Indicador

O indicador recebe **10% do lucro líquido da corretora**.

### Exemplo de Cálculo

**Cenário:**
- Investimento: R$ 1.000
- Lucro total: R$ 2.000
- Lucro líquido: R$ 1.000 (2.000 - 1.000)

**Cálculo:**
1. Performance Fee da Corretora: 50% de R$ 1.000 = **R$ 500**
2. Lucro do Cliente: R$ 1.000 - R$ 500 = **R$ 1.500**
3. Comissão do Indicador: 10% de R$ 500 = **R$ 50**

## 📊 Estrutura de Dados

### Tabela `referrals` (Atualizada)

A tabela foi expandida para incluir:

- `investment_amount`: Valor do investimento
- `profit_amount`: Lucro total gerado
- `broker_fee_percentage`: Percentual da taxa da corretora
- `broker_profit`: Lucro da corretora
- `last_commission_date`: Data da última comissão calculada
- `updated_at`: Data da última atualização

### Tabela `invoices`

Faturas de performance fee que o cliente deve pagar à corretora.

## 🔧 Serviços Implementados

### 1. `referralCommissionService.js`

Serviço responsável por calcular e processar comissões de indicações.

**Funções principais:**
- `calculateBrokerPerformanceFee(investmentAmount)`: Calcula a taxa da corretora
- `calculateReferralCommission(profit, investmentAmount)`: Calcula a comissão do indicador
- `processReferralCommission(userId, profit, investmentAmount, investmentId)`: Processa e salva a comissão
- `getReferralStats(referrerId)`: Obtém estatísticas de comissões

### 2. `invoiceService.js`

Serviço responsável por gerar e gerenciar faturas de performance.

**Funções principais:**
- `calculatePerformanceFee(profit, investmentAmount)`: Calcula a performance fee
- `createPerformanceInvoice(...)`: Cria uma fatura de performance
- `generateWeeklyInvoices(userId, weekStart, weekEnd)`: Gera faturas semanais
- `markInvoiceAsPaid(invoiceId, paidDate)`: Marca fatura como paga
- `getPendingInvoices(userId)`: Obtém faturas pendentes

### 3. `profitProcessingService.js`

Serviço responsável por processar lucros e calcular comissões automaticamente.

**Funções principais:**
- `processInvestmentProfit(userId, investmentId, newProfit, previousProfit)`: Processa lucro de investimento
- `processMT4AccountProfit(userId, mt4AccountId, profit, investmentAmount)`: Processa lucro de conta MT4
- `processWeeklyProfit(userId, weekStart, weekEnd)`: Processa lucro semanal

## 🚀 Endpoints da API

### Indicações

#### `GET /api/dashboard/referrals`
Obtém dados de indicações do usuário, incluindo:
- Código de referência
- Total de indicações
- Comissões totais e pendentes
- Lista detalhada de indicações

### Processamento de Lucros

#### `POST /api/dashboard/process-investment-profit`
Processa lucro de um investimento e calcula comissões automaticamente.

**Body:**
```json
{
  "investmentId": "uuid",
  "newProfit": 1000.00,
  "previousProfit": 500.00
}
```

#### `POST /api/dashboard/process-mt4-profit`
Processa lucro de uma conta MT4.

**Body:**
```json
{
  "mt4AccountId": "uuid",
  "profit": 2000.00,
  "investmentAmount": 5000.00
}
```

### Faturas

#### `GET /api/dashboard/invoices`
Obtém faturas do usuário (já existente, atualizado com totais).

#### `POST /api/dashboard/invoices/create`
Cria uma fatura de performance.

**Body:**
```json
{
  "profit": 2000.00,
  "investmentAmount": 5000.00,
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-07",
  "description": "Performance Fee Semanal"
}
```

#### `POST /api/dashboard/invoices/generate-weekly`
Gera faturas semanais automaticamente.

**Body:**
```json
{
  "weekStart": "2025-01-01",
  "weekEnd": "2025-01-07"
}
```

#### `POST /api/dashboard/invoices/mark-paid`
Marca uma fatura como paga.

**Body:**
```json
{
  "invoiceId": "uuid",
  "paidDate": "2025-01-15"
}
```

## 📝 Como Usar

### 1. Executar Migration

Primeiro, execute a migration para atualizar a tabela `referrals`:

```bash
node backend/src/config/runMigrationReferralDetails.js
```

### 2. Processar Lucros Automaticamente

Quando um investimento ou conta MT4 gera lucro, chame o endpoint apropriado:

```javascript
// Para investimento
POST /api/dashboard/process-investment-profit
{
  "investmentId": "...",
  "newProfit": 2000.00,
  "previousProfit": 1000.00
}

// Para conta MT4
POST /api/dashboard/process-mt4-profit
{
  "mt4AccountId": "...",
  "profit": 1500.00,
  "investmentAmount": 5000.00
}
```

O sistema automaticamente:
1. Calcula a performance fee da corretora
2. Calcula e atribui a comissão ao indicador (se houver)
3. Cria transações apropriadas
4. Atualiza saldos

### 3. Gerar Faturas

Para gerar faturas de performance fee:

```javascript
// Gerar faturas semanais
POST /api/dashboard/invoices/generate-weekly
{
  "weekStart": "2025-01-01",
  "weekEnd": "2025-01-07"
}

// Ou criar uma fatura específica
POST /api/dashboard/invoices/create
{
  "profit": 2000.00,
  "investmentAmount": 5000.00,
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-07"
}
```

## 🔄 Fluxo Automático Recomendado

1. **Sincronização Semanal com MyFXBook**
   - Buscar lucros das contas MT4
   - Processar lucros usando `processMT4Profit`
   - Gerar faturas semanais usando `generateWeeklyInvoices`

2. **Processamento de Investimentos**
   - Quando um investimento gera lucro, usar `processInvestmentProfit`
   - O sistema calcula e distribui comissões automaticamente

## 📊 Exemplo de Integração

```javascript
// Exemplo: Processar lucro semanal de uma conta MT4
const processWeeklyMT4Profit = async (userId, mt4AccountId, weeklyProfit, investmentAmount) => {
  // Processar lucro e calcular comissões
  const profitResult = await processMT4AccountProfit(
    userId,
    mt4AccountId,
    weeklyProfit,
    investmentAmount
  );
  
  // Gerar fatura de performance
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const invoiceResult = await createPerformanceInvoice(
    userId,
    weeklyProfit,
    investmentAmount,
    weekStart,
    weekEnd,
    `Performance Fee Semanal - Conta MT4 ${mt4AccountId}`
  );
  
  return {
    profit: profitResult,
    invoice: invoiceResult
  };
};
```

## ⚠️ Observações Importantes

1. **Comissões são acumulativas**: Cada vez que há lucro, a comissão é adicionada ao total do indicador.

2. **Faturas são independentes**: As faturas representam o que o cliente deve pagar à corretora, não afetam diretamente as comissões.

3. **Performance Fee é calculada sobre o lucro**: A taxa é aplicada sobre o lucro líquido (ganho - investimento inicial).

4. **Validações**: O sistema valida que:
   - Lucros não podem ser negativos para gerar comissões
   - Faturas só são criadas se houver lucro positivo
   - Usuários só podem marcar suas próprias faturas como pagas

## 🧪 Testes

Para testar o sistema:

1. Criar um usuário indicador
2. Criar um usuário indicado (com `referred_by` apontando para o indicador)
3. Criar um investimento para o usuário indicado
4. Processar lucro usando `processInvestmentProfit`
5. Verificar se a comissão foi calculada e atribuída corretamente
6. Verificar se a fatura foi gerada (se aplicável)
