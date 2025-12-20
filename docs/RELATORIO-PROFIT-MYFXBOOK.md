# 📊 Relatório de Profit - Integração MyFXBook

## ✅ Confirmação de Suporte

A API do MyFXBook **POSSUI SUPORTE COMPLETO** para obter dados de profit através de múltiplos métodos:

### Métodos Disponíveis:

1. **`get-my-accounts`** - Retorna `profit` total da conta
   ```json
   {
     "profit": 892.45,
     "gain": 8.92,
     "balance": 10892.45
   }
   ```

2. **`get-daily-gain`** - Retorna `profit` por dia
   ```json
   {
     "dailyGain": [
       {
         "date": "02/01/2010",
         "value": 0.07,
         "profit": 0.03
       }
     ]
   }
   ```

3. **`get-data-daily`** - Retorna dados diários completos incluindo `profit`
   ```json
   {
     "dataDaily": [
       {
         "date": "02/01/2010",
         "balance": 25083.56,
         "profit": 84.7400,
         "equity": 24583.41,
         "pips": 83.30
       }
     ]
   }
   ```

## 🎯 Implementação no Código

### Backend

Já temos implementado em `backend/src/services/myfxbookService.js`:

- ✅ `getMyAccounts()` - Obtém profit total
- ✅ `getDailyGain()` - Obtém profit diário
- ✅ `getDataDaily()` - Obtém dados diários completos com profit

### Frontend

**Página de Relatórios** (`frontend/src/page/RelatoriosPerformancePage.jsx`):

#### Seção "Relatório de Profit Diário"

Nova seção que exibe:

1. **Cards de Estatísticas:**
   - **Profit Total**: Soma de todos os profits no período
   - **Média Diária**: Profit médio por dia
   - **Melhor Dia**: Dia com maior profit
   - **Pior Dia**: Dia com menor profit (pode ser negativo)

2. **Cards Adicionais:**
   - **Dias com Profit**: Quantidade e percentual de dias lucrativos
   - **Dias com Loss**: Quantidade e percentual de dias com prejuízo

3. **Tabela de Profit Diário:**
   - Data do dia
   - Profit diário (colorido: verde para positivo, vermelho para negativo)
   - Balance no fim do dia
   - Equity no fim do dia
   - Status (badge: Profit/Loss)

#### Dados Utilizados

Os dados vêm diretamente da API do MyFXBook através do método `get-data-daily` que retorna:

```javascript
{
  "date": "02/01/2010",
  "balance": 25083.56,
  "profit": 84.7400,        // ← Profit diário
  "equity": 24583.41,
  "pips": 83.30,
  "lots": 0.41,
  "floatingPL": -500.00
}
```

## 📋 Exemplo de Uso

### 1. Acessar Relatórios

Navegue para `/relatorios-performance` no frontend.

### 2. Selecionar Período

Escolha um período (Hoje, 7 dias, Este mês, Este ano, ou Personalizado).

### 3. Visualizar Dados de Profit

A seção "Relatório de Profit Diário" aparece automaticamente se:
- A conta está conectada ao MyFXBook
- Há dados disponíveis no período selecionado

### 4. Dados Exibidos

- **Profit Total**: $63,528.23 (exemplo)
- **Média Diária**: $1,587.21
- **Melhor Dia**: $5,234.50 (em 19/12/2025)
- **Pior Dia**: -$892.10 (em 15/12/2025)
- **Dias com Profit**: 32 dias (80% dos dias)
- **Dias com Loss**: 8 dias (20% dos dias)

## 🔄 Fluxo de Dados

```
MyFXBook API
    ↓
get-data-daily (backend)
    ↓
dashboardController.getMyfxbookData
    ↓
Frontend: RelatoriosPerformancePage
    ↓
profitStats (useMemo)
    ↓
Renderização: Cards + Tabela
```

## 📊 Gráfico de Profit

O gráfico principal também inclui os dados de profit quando disponíveis através de `dataDaily`.

## ✅ Validação

Para confirmar que os dados estão sendo obtidos:

1. **Verificar no Console do Navegador:**
   ```javascript
   console.log('[Relatórios] Resultado MyFXBook:', myfxbookResult)
   ```

2. **Verificar no Backend (logs):**
   ```
   [getMyfxbookData] Dados recebidos: {
     dataDaily: 30,  // Número de registros diários
     ...
   }
   ```

3. **Verificar na Tabela:**
   - Se a seção "Relatório de Profit Diário" aparece, os dados estão disponíveis
   - Se não aparece, verifique se a conta está conectada ao MyFXBook

## 🎯 Próximos Passos

Se necessário, podemos:

1. Adicionar gráfico específico de profit (linha temporal)
2. Exportar dados de profit para CSV/Excel
3. Comparar profit entre períodos
4. Alertas quando profit diário ultrapassa limites

## 📚 Referências

- [Documentação Oficial MyFXBook API](https://www.myfxbook.com/api)
- Método `get-data-daily`: Retorna profit diário completo
- Método `get-daily-gain`: Retorna gain e profit por dia
- Método `get-my-accounts`: Retorna profit total da conta
