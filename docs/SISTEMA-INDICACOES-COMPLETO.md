# Sistema de Indicações Completo - TraderNex

## ✅ Implementação Completa

### 1. **Link de Indicação Funcional**

O link de indicação agora funciona corretamente:
- **Formato:** `app.tradernex.com/register?ref=CODIGO`
- Quando alguém clica no link, o código é automaticamente preenchido no formulário de registro
- O código é validado e salvo no backend durante o registro

### 2. **Registro com Código de Indicação**

**Frontend (`RegisterPage.jsx`):**
- Detecta automaticamente o código de indicação na URL (`?ref=CODIGO`)
- Preenche o campo automaticamente
- Envia o código para o backend durante o registro

**Backend (`authController.js`):**
- Valida o código de indicação
- Busca o usuário indicador pelo código
- Salva o `referred_by` no perfil do novo usuário
- Cria registro na tabela `referrals` (sem comissão ainda)

### 3. **Processamento Semanal de Comissões**

**Serviço (`weeklyCommissionService.js`):**
- Processa comissões toda sexta-feira
- Calcula lucros da semana (segunda a sexta)
- Para cada usuário com lucro:
  - Calcula comissão do indicador (10% do lucro da corretora)
  - Cria fatura de performance fee
  - Atualiza saldos

**Lógica de Cálculo:**
1. Busca todos os usuários com investimentos ativos
2. Para cada investimento com lucro na semana:
   - Calcula performance fee da corretora (50%, 40% ou 30% baseado no investimento)
   - Calcula comissão do indicador (10% do lucro da corretora)
   - Salva comissão na tabela `referrals`
   - Cria fatura de performance fee

### 4. **Endpoints Criados**

**Admin:**
- `POST /api/admin/referrals/process-weekly` - Processar comissões semanais manualmente

**Cliente:**
- `GET /api/dashboard/referrals` - Ver suas indicações e comissões
- `GET /api/dashboard/invoices` - Ver faturas de performance fee

### 5. **Painel de Admin**

**Página:** `/admin/referrals`
- Visualiza todas as comissões
- Filtra por status (todas, pendentes, pagas)
- Aprova/rejeita pagamentos
- Processa comissões semanais manualmente
- Estatísticas completas

## 🔄 Fluxo Completo

### 1. Usuário A indica Usuário B

1. **Usuário A** acessa `/referral-program`
2. Copia o link: `app.tradernex.com/register?ref=TN12345678`
3. **Usuário B** clica no link
4. É redirecionado para `/register?ref=TN12345678`
5. O código é preenchido automaticamente
6. **Usuário B** se registra
7. Sistema salva `referred_by = ID do Usuário A` no perfil do Usuário B
8. Cria registro em `referrals` (sem comissão ainda)

### 2. Processamento Semanal (Sexta-feira)

1. Admin executa processamento semanal (ou automático via cron)
2. Sistema busca todos os usuários com investimentos ativos
3. Para cada investimento com lucro na semana:
   - **Exemplo:** Usuário B investiu R$ 1.000 e ganhou R$ 2.000 (lucro de R$ 1.000)
   - Performance Fee: 50% de R$ 1.000 = R$ 500 (corretora)
   - Comissão do Usuário A: 10% de R$ 500 = R$ 50
   - Sistema salva R$ 50 na tabela `referrals`
   - Cria fatura de R$ 500 para Usuário B

### 3. Visualização e Pagamento

1. **Usuário A** acessa `/referral-program` e vê sua comissão acumulada
2. **Admin** acessa `/admin/referrals` e vê todas as comissões pendentes
3. Admin aprova pagamento quando a fatura do cliente é paga
4. Comissão fica disponível para saque

## 📋 Como Usar

### Para Usuários

1. **Compartilhar Link:**
   - Acesse `/referral-program`
   - Copie o link de indicação
   - Compartilhe com amigos

2. **Ver Comissões:**
   - Acesse `/referral-program`
   - Veja suas comissões acumuladas
   - Veja histórico de indicações

### Para Administradores

1. **Processar Comissões Semanais:**
   - Acesse `/admin/referrals`
   - Clique em "Processar Comissões Semanais"
   - Sistema calcula todas as comissões baseado nos lucros da semana

2. **Gerenciar Pagamentos:**
   - Veja todas as comissões pendentes
   - Aprove ou rejeite pagamentos
   - Veja estatísticas completas

## ⚙️ Configuração de Cron (Opcional)

Para processar automaticamente toda sexta-feira, você pode configurar um cron job:

```bash
# Executar toda sexta-feira às 18:00
0 18 * * 5 node backend/src/scripts/processWeeklyCommissions.js
```

Ou criar um script:

```javascript
// backend/src/scripts/processWeeklyCommissions.js
const { processWeeklyCommissions } = require('../services/weeklyCommissionService');

processWeeklyCommissions()
  .then(result => {
    console.log('✅ Comissões processadas:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
```

## 🔍 Validações Implementadas

- ✅ Código de indicação é validado no registro
- ✅ Usuário não pode se auto-indicar
- ✅ Código inválido não bloqueia o registro (apenas não cria indicação)
- ✅ Comissões só são calculadas se houver lucro positivo
- ✅ Processamento semanal considera apenas lucros da semana atual
- ✅ Faturas só são criadas se houver lucro positivo

## 📊 Estrutura de Dados

### Tabela `referrals`
- `referrer_id`: ID do indicador
- `referred_id`: ID do indicado
- `commission`: Comissão acumulada
- `commission_paid`: Se foi paga
- `investment_amount`: Valor do investimento
- `profit_amount`: Lucro gerado
- `broker_fee_percentage`: % da taxa da corretora
- `broker_profit`: Lucro da corretora
- `last_commission_date`: Data da última comissão

### Tabela `client_profiles`
- `referred_by`: ID do usuário que indicou
- `referral_code`: Código único de indicação

## 🎯 Próximos Passos Recomendados

1. **Integração com MyFXBook:**
   - Calcular lucros semanais baseado em dados do MyFXBook
   - Processar automaticamente quando detectar lucros

2. **Notificações:**
   - Email quando comissão for creditada
   - Email quando fatura for gerada

3. **Cron Job:**
   - Configurar processamento automático toda sexta-feira

4. **Dashboard de Estatísticas:**
   - Gráficos de comissões ao longo do tempo
   - Top indicadores
   - Taxa de conversão
