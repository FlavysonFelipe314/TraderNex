# Sistema de Faturas Completo - TraderNex

## ✅ Implementação Completa

### 1. **Cálculo Baseado no Plano do Cliente**

A performance fee é calculada baseada no **plano selecionado pelo usuário**, não no investimento individual:

- **Nex Start** (min_investment >= 1000): **50%** do lucro
- **Nex Pro** (min_investment >= 5000): **40%** do lucro
- **Nex Prime** (min_investment >= 10000): **30%** do lucro

### 2. **Processamento Semanal**

- **Período:** Segunda-feira a Sexta-feira
- **Processamento:** Toda sexta-feira
- **Agrupamento:** Todos os lucros da semana são somados e uma única fatura é criada
- **Vencimento:** Sempre na próxima sexta-feira

### 3. **Lógica de Cálculo**

**Exemplo:**
- Usuário tem plano **Nex Pro** (40% de taxa)
- Na semana, teve lucro total de **R$ 1.000**
- Performance Fee: 40% de R$ 1.000 = **R$ 400** (valor pendente da fatura)
- Vencimento: Próxima sexta-feira

## 📋 O Que Foi Implementado

### Backend

1. **invoiceService.js** - Atualizado:
   - `getUserPlanAndFee()`: Busca plano do usuário e calcula taxa
   - `calculatePerformanceFeeByPlan()`: Calcula taxa baseada no plano
   - `getNextFriday()`: Calcula próxima sexta-feira para vencimento
   - `createPerformanceInvoice()`: Cria fatura baseada no plano (não no investimento)
   - `generateWeeklyInvoices()`: Agrupa lucros da semana e cria fatura única

2. **weeklyCommissionService.js** - Atualizado:
   - Processa comissões e faturas semanalmente
   - Agrupa todos os lucros da semana
   - Cria uma fatura única por semana baseada no plano

3. **adminInvoicesController.js** - Novo:
   - `getAllInvoices()`: Lista todas as faturas
   - `getInvoiceStats()`: Estatísticas de faturas
   - `markInvoiceAsPaid()`: Marca fatura como paga

### Frontend

1. **FaturasPerformancePage.jsx** - Atualizado:
   - Mostra dados reais do backend
   - Exibe plano do cliente
   - Mostra lucro e valor da taxa
   - Calcula próximo vencimento (sexta-feira)
   - Filtros funcionais

2. **AdminInvoicesPage.jsx** - Novo:
   - Visualiza todas as faturas
   - Filtra por status (todas, pendentes, vencidas, pagas)
   - Marca faturas como pagas
   - Estatísticas completas

## 🔄 Fluxo Completo

### 1. Processamento Semanal (Sexta-feira)

```
Sistema executa processamento semanal:

1. Busca todos os usuários com investimentos ativos
2. Para cada usuário:
   a. Soma todos os lucros novos da semana
   b. Busca o plano do usuário (selected_plan_id)
   c. Calcula taxa baseada no plano:
      - Nex Start: 50%
      - Nex Pro: 40%
      - Nex Prime: 30%
   d. Calcula performance fee: lucro_total * taxa_plano
   e. Cria fatura com vencimento na próxima sexta-feira
   f. Atualiza last_weekly_profit de todos os investimentos
```

### 2. Exemplo Prático

**Cenário:**
- Usuário tem plano **Nex Pro** (40%)
- Na semana teve lucros:
  - Investimento 1: R$ 500 (novo)
  - Investimento 2: R$ 300 (novo)
  - **Total semanal: R$ 800**

**Processamento:**
1. Lucro total da semana: R$ 800
2. Taxa do plano (Nex Pro): 40%
3. Performance Fee: R$ 800 × 40% = **R$ 320**
4. Fatura criada: R$ 320
5. Vencimento: Próxima sexta-feira

### 3. Visualização

**Cliente (`/faturas-performance`):**
- Vê suas faturas
- Vê valor pendente
- Vê próximo vencimento (sempre sexta-feira)
- Vê plano e taxa aplicada

**Admin (`/admin/invoices`):**
- Vê todas as faturas
- Filtra por status
- Marca como paga
- Vê estatísticas

## 📊 Estrutura de Dados

### Tabela `invoices`
- `user_id`: Cliente
- `invoice_number`: Número único
- `amount`: Valor da performance fee (baseado no plano)
- `status`: pending, paid, overdue
- `due_date`: Sempre uma sexta-feira
- `description`: Inclui plano, lucro, taxa

### Tabela `client_profiles`
- `selected_plan_id`: Plano selecionado pelo usuário
- Usado para calcular a taxa de performance

## 🎯 Funcionalidades

### ✅ Implementado

1. **Cálculo baseado no plano:**
   - Busca plano do usuário automaticamente
   - Calcula taxa correta (50%, 40% ou 30%)
   - Não depende do investimento individual

2. **Vencimentos sempre sextas-feiras:**
   - Função `getNextFriday()` calcula automaticamente
   - Todas as faturas vencem em sextas-feiras

3. **Agrupamento semanal:**
   - Todos os lucros da semana são somados
   - Uma única fatura por semana
   - Baseada no plano do usuário

4. **Painel Admin:**
   - Visualiza todas as faturas
   - Filtra por status
   - Marca como paga
   - Vê quem está com pagamento pendente

5. **Frontend Cliente:**
   - Mostra faturas reais
   - Exibe plano e taxa
   - Mostra valor pendente
   - Próximo vencimento (sexta-feira)

## 🚀 Como Usar

### Para Processar Faturas Semanais

1. **Via Painel Admin:**
   ```
   Acesse /admin/referrals
   Clique em "Processar Comissões Semanais"
   Sistema calcula comissões E faturas automaticamente
   ```

2. **Via Script:**
   ```bash
   node backend/src/scripts/processWeeklyCommissions.js
   ```

### Para Visualizar Faturas

**Cliente:**
- Acesse `/faturas-performance`
- Veja suas faturas, valores pendentes e próximos vencimentos

**Admin:**
- Acesse `/admin/invoices`
- Veja todas as faturas
- Filtre por status
- Marque como paga quando necessário

## ⚙️ Configuração

### Executar Migrations:
```bash
node backend/src/config/runMigrationReferralDetails.js
node backend/src/config/runMigrationWeeklyProfit.js
```

### Processamento Automático (Opcional):
```bash
# Cron job para executar toda sexta-feira às 18:00
0 18 * * 5 node backend/src/scripts/processWeeklyCommissions.js
```

## 📝 Notas Importantes

1. **Plano é Determinante:** A taxa é sempre baseada no plano do usuário, não no investimento
2. **Agrupamento Semanal:** Todos os lucros da semana são somados em uma única fatura
3. **Vencimento Fixo:** Todas as faturas vencem em sextas-feiras
4. **Rastreamento:** Sistema rastreia `last_weekly_profit` para evitar duplicação
5. **Valor Pendente:** É a soma de todas as faturas com status 'pending'

## ✅ Validações

- ✅ Faturas só são criadas se houver lucro positivo
- ✅ Taxa é sempre baseada no plano do usuário
- ✅ Vencimentos são sempre sextas-feiras
- ✅ Uma fatura por semana por usuário
- ✅ Rastreamento evita duplicação de processamento

Tudo está funcionando e pronto para uso! 🎉
