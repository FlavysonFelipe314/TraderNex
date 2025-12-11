# 📚 TraderNex Backend - Documentação Completa

## 🏗️ Arquitetura do Projeto

```
backend/
│
├── src/
│   ├── config/              # Configurações
│   │   ├── database.js      # Conexão PostgreSQL com Pool
│   │   ├── schema.sql       # Schema completo do banco (13 tabelas)
│   │   └── initDB.js        # Script de inicialização do DB
│   │
│   ├── controllers/         # Lógica de negócio
│   │   ├── authController.js       # Autenticação e autorização
│   │   ├── dashboardController.js  # Dashboard e métricas
│   │   └── supportController.js    # Sistema de suporte
│   │
│   ├── middleware/          # Middlewares
│   │   └── auth.js          # Validação JWT
│   │
│   ├── routes/              # Definição de rotas
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── supportRoutes.js
│   │
│   └── server.js            # Servidor Express principal
│
├── .env                     # Variáveis de ambiente (não versionado)
├── .env.example             # Template de variáveis
├── .gitignore              # Arquivos ignorados pelo Git
├── package.json            # Dependências e scripts
├── README.md               # Documentação geral
├── SETUP.md                # Guia de instalação rápido
└── OVERVIEW.md             # Este arquivo

```

---

## 📦 Dependências

### Produção
- **express** ^5.1.0 - Framework web
- **pg** ^8.16.3 - Cliente PostgreSQL
- **bcrypt** ^6.0.0 - Hash de senhas
- **jsonwebtoken** ^9.0.2 - Autenticação JWT
- **cors** ^2.8.5 - Cross-Origin Resource Sharing
- **dotenv** ^17.2.3 - Variáveis de ambiente
- **express-validator** ^7.3.1 - Validação de dados

### Desenvolvimento
- **nodemon** ^3.1.11 - Auto-reload do servidor

---

## 🗄️ Modelo de Dados Completo

### 1. **users** - Tabela de Usuários
```sql
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE
- password: VARCHAR(255) (bcrypt hash)
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- phone: VARCHAR(20)
- country: VARCHAR(100)
- email_verified: BOOLEAN
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 2. **client_profiles** - Perfis de Cliente
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- account_type: VARCHAR(50) (Basic, Pro, Premium)
- balance: DECIMAL(15,2)
- total_invested: DECIMAL(15,2)
- total_profit: DECIMAL(15,2)
- profit_percentage: DECIMAL(5,2)
- referral_code: VARCHAR(20) UNIQUE
- referred_by: UUID (FK → users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 3. **mt4_accounts** - Contas MetaTrader 4
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- account_number: VARCHAR(50)
- account_name: VARCHAR(100)
- broker: VARCHAR(100)
- server: VARCHAR(100)
- balance: DECIMAL(15,2)
- equity: DECIMAL(15,2)
- currency: VARCHAR(10)
- status: VARCHAR(20) (active, inactive, suspended)
- connected_at: TIMESTAMP
- last_sync: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 4. **investment_plans** - Planos de Investimento
```sql
- id: UUID (PK)
- name: VARCHAR(100)
- description: TEXT
- min_investment: DECIMAL(15,2)
- max_investment: DECIMAL(15,2)
- expected_return: DECIMAL(5,2) (%)
- duration_days: INTEGER
- risk_level: VARCHAR(20) (Low, Medium, High)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Planos Pré-cadastrados:**
1. **Starter** - $100-$1,000 | 5% retorno | 30 dias | Baixo risco
2. **Professional** - $1,000-$10,000 | 12% retorno | 60 dias | Médio risco
3. **Premium** - $10,000-$50,000 | 20% retorno | 90 dias | Alto risco
4. **Elite** - $50,000+ | 30% retorno | 180 dias | Alto risco

### 5. **user_investments** - Investimentos dos Usuários
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- plan_id: UUID (FK → investment_plans)
- amount: DECIMAL(15,2)
- status: VARCHAR(20) (active, completed, cancelled)
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- current_value: DECIMAL(15,2)
- profit: DECIMAL(15,2)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 6. **transactions** - Histórico de Transações
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- type: VARCHAR(50) (deposit, withdrawal, profit, fee, referral_bonus)
- amount: DECIMAL(15,2)
- status: VARCHAR(20) (pending, completed, failed, cancelled)
- description: TEXT
- reference: VARCHAR(100)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 7. **invoices** - Faturas
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- invoice_number: VARCHAR(50) UNIQUE
- amount: DECIMAL(15,2)
- status: VARCHAR(20) (pending, paid, overdue, cancelled)
- due_date: DATE
- paid_date: DATE
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 8. **performance_reports** - Relatórios de Performance
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- report_date: DATE
- total_trades: INTEGER
- winning_trades: INTEGER
- losing_trades: INTEGER
- win_rate: DECIMAL(5,2) (%)
- total_profit: DECIMAL(15,2)
- total_loss: DECIMAL(15,2)
- net_profit: DECIMAL(15,2)
- roi: DECIMAL(5,2) (%)
- created_at: TIMESTAMP
```

### 9. **referrals** - Sistema de Indicações
```sql
- id: UUID (PK)
- referrer_id: UUID (FK → users)
- referred_id: UUID (FK → users)
- commission: DECIMAL(15,2)
- commission_paid: BOOLEAN
- status: VARCHAR(20) (active, inactive)
- created_at: TIMESTAMP
```

### 10. **support_tickets** - Tickets de Suporte
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- subject: VARCHAR(255)
- message: TEXT
- status: VARCHAR(20) (open, in_progress, resolved, closed)
- priority: VARCHAR(20) (low, medium, high, urgent)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 11. **support_responses** - Respostas aos Tickets
```sql
- id: UUID (PK)
- ticket_id: UUID (FK → support_tickets)
- user_id: UUID (FK → users)
- message: TEXT
- is_admin: BOOLEAN
- created_at: TIMESTAMP
```

### 12. **password_reset_tokens** - Tokens de Reset
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- token: VARCHAR(255) UNIQUE
- expires_at: TIMESTAMP
- used: BOOLEAN
- created_at: TIMESTAMP
```

---

## 🔐 Sistema de Autenticação

### Fluxo de Registro
1. Cliente envia dados (email, senha, nome, etc.)
2. Validação dos dados com express-validator
3. Verificação se email já existe
4. Hash da senha com bcrypt (salt rounds: 10)
5. Inserção do usuário no banco
6. Criação automática do perfil do cliente
7. Geração de código de referência único
8. Geração de token JWT
9. Retorno do token e dados do usuário

### Fluxo de Login
1. Cliente envia email e senha
2. Busca do usuário no banco
3. Verificação se usuário está ativo
4. Comparação da senha com bcrypt
5. Geração de token JWT (válido por 7 dias)
6. Retorno do token e dados do usuário

### Middleware de Autenticação
```javascript
// Todas as rotas protegidas verificam:
Authorization: Bearer <token>
```

### Reset de Senha
1. Usuário solicita reset com email
2. Gera token JWT especial (válido 1h)
3. Token salvo no banco
4. Token enviado (implementar email)
5. Usuário usa token para definir nova senha
6. Token marcado como usado

---

## 📡 API Endpoints - Referência Completa

### 🔓 Autenticação (`/api/auth`)

#### POST `/api/auth/register`
Registrar novo usuário
```json
Request:
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "firstName": "João",
  "lastName": "Silva",
  "phone": "+5511999999999",
  "country": "Brasil"
}

Response (201):
{
  "success": true,
  "message": "Usuário registrado com sucesso!",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "firstName": "João",
      "lastName": "Silva"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Login de usuário
```json
Request:
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}

Response (200):
{
  "success": true,
  "message": "Login realizado com sucesso!",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "firstName": "João",
      "lastName": "Silva",
      "emailVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/forgot-password`
Solicitar reset de senha
```json
Request:
{
  "email": "usuario@exemplo.com"
}

Response (200):
{
  "success": true,
  "message": "Se o email existir, você receberá instruções...",
  "resetToken": "token_here" // Apenas em dev
}
```

#### POST `/api/auth/reset-password`
Redefinir senha
```json
Request:
{
  "token": "reset_token",
  "newPassword": "novaSenha123"
}

Response (200):
{
  "success": true,
  "message": "Senha redefinida com sucesso!"
}
```

#### POST `/api/auth/verify-email`
Verificar email
```json
Request:
{
  "token": "verification_token"
}

Response (200):
{
  "success": true,
  "message": "Email verificado com sucesso!"
}
```

#### GET `/api/auth/profile` 🔒
Obter perfil do usuário autenticado
```json
Headers:
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999999999",
    "country": "Brasil",
    "email_verified": true,
    "account_type": "Pro",
    "balance": 10000.00,
    "total_invested": 5000.00,
    "total_profit": 500.00,
    "profit_percentage": 10.00,
    "referral_code": "TN12345678"
  }
}
```

---

### 📊 Dashboard (`/api/dashboard`) 🔒

#### GET `/api/dashboard/overview`
Dados gerais do dashboard
```json
Response (200):
{
  "success": true,
  "data": {
    "profile": {
      "balance": 42350.27,
      "totalInvested": 30000.00,
      "totalProfit": 12350.27,
      "profitPercentage": 41.17,
      "accountType": "Professional"
    },
    "mt4Accounts": {
      "totalAccounts": 2,
      "totalBalance": 15000.00,
      "totalEquity": 15234.50
    },
    "recentTransactions": [...],
    "investments": {
      "activeInvestments": 3,
      "totalInvestedAmount": 30000.00,
      "currentTotalValue": 42350.27
    }
  }
}
```

#### GET `/api/dashboard/performance?period=week`
Estatísticas de performance
```
Query Params:
- period: day | week | month | year

Response (200):
{
  "success": true,
  "data": [
    {
      "report_date": "2024-01-01",
      "total_trades": 45,
      "winning_trades": 32,
      "losing_trades": 13,
      "win_rate": 71.11,
      "total_profit": 2500.00,
      "total_loss": 800.00,
      "net_profit": 1700.00,
      "roi": 5.67
    }
  ]
}
```

#### GET `/api/dashboard/mt4-accounts`
Listar contas MT4
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account_number": "12345678",
      "account_name": "Conta Principal",
      "broker": "IC Markets",
      "server": "ICMarkets-Demo",
      "balance": 10000.00,
      "equity": 10250.00,
      "currency": "USD",
      "status": "active",
      "connected_at": "2024-01-01T00:00:00Z",
      "last_sync": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/dashboard/mt4-accounts`
Adicionar conta MT4
```json
Request:
{
  "accountNumber": "12345678",
  "accountName": "Conta Principal",
  "broker": "IC Markets",
  "server": "ICMarkets-Demo",
  "balance": 10000.00,
  "currency": "USD"
}

Response (201):
{
  "success": true,
  "message": "Conta MT4 adicionada com sucesso!",
  "data": { ... }
}
```

#### GET `/api/dashboard/investment-plans`
Listar planos de investimento disponíveis
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Plano Starter",
      "description": "Ideal para iniciantes...",
      "min_investment": 100.00,
      "max_investment": 1000.00,
      "expected_return": 5.00,
      "duration_days": 30,
      "risk_level": "Low"
    }
  ]
}
```

#### GET `/api/dashboard/investments`
Listar investimentos do usuário
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 5000.00,
      "status": "active",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "current_value": 5250.00,
      "profit": 250.00,
      "plan_name": "Plano Professional",
      "expected_return": 12.00,
      "risk_level": "Medium"
    }
  ]
}
```

#### GET `/api/dashboard/transactions?type=deposit&status=completed&limit=50`
Listar transações
```
Query Params:
- type: deposit | withdrawal | profit | fee | referral_bonus
- status: pending | completed | failed | cancelled
- limit: número (padrão: 50)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 1000.00,
      "status": "completed",
      "description": "Depósito via PIX",
      "reference": "TXN123456",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### GET `/api/dashboard/invoices`
Listar faturas
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2024-001",
      "amount": 100.00,
      "status": "paid",
      "due_date": "2024-01-31",
      "paid_date": "2024-01-15",
      "description": "Taxa de gerenciamento mensal",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/api/dashboard/referrals`
Dados do programa de referência
```json
Response (200):
{
  "success": true,
  "data": {
    "referralCode": "TN12345678",
    "referrals": [
      {
        "id": "uuid",
        "first_name": "Maria",
        "last_name": "Santos",
        "email": "maria@exemplo.com",
        "commission": 50.00,
        "commission_paid": true,
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "total_referrals": 5,
      "total_commission": 250.00,
      "paid_commission": 200.00
    }
  }
}
```

---

### 🎫 Suporte (`/api/support`) 🔒

#### POST `/api/support/tickets`
Criar ticket de suporte
```json
Request:
{
  "subject": "Problema com saque",
  "message": "Não consigo realizar o saque da minha conta...",
  "priority": "high"
}

Response (201):
{
  "success": true,
  "message": "Ticket criado com sucesso!",
  "data": {
    "id": "uuid",
    "subject": "Problema com saque",
    "status": "open",
    "priority": "high",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### GET `/api/support/tickets`
Listar todos os tickets do usuário
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subject": "Problema com saque",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### GET `/api/support/tickets/:ticketId`
Obter detalhes de um ticket
```json
Response (200):
{
  "success": true,
  "data": {
    "ticket": {
      "id": "uuid",
      "subject": "Problema com saque",
      "message": "Não consigo realizar o saque...",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "responses": [
      {
        "id": "uuid",
        "message": "Olá, estamos verificando...",
        "is_admin": true,
        "first_name": "Suporte",
        "last_name": "TraderNex",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### POST `/api/support/tickets/:ticketId/responses`
Adicionar resposta a um ticket
```json
Request:
{
  "message": "Ainda aguardo retorno sobre meu problema."
}

Response (201):
{
  "success": true,
  "message": "Resposta adicionada com sucesso!",
  "data": { ... }
}
```

#### PATCH `/api/support/tickets/:ticketId/close`
Fechar um ticket
```json
Response (200):
{
  "success": true,
  "message": "Ticket fechado com sucesso!",
  "data": { ... }
}
```

---

## 🛡️ Segurança Implementada

✅ **Senhas**
- Hash com bcrypt (10 salt rounds)
- Nunca armazenadas em texto plano

✅ **Autenticação**
- JWT com expiração configurável (padrão: 7 dias)
- Token incluído no header Authorization

✅ **Validação**
- Express-validator em todas as rotas de entrada
- Sanitização de dados

✅ **Database**
- Prepared statements (proteção contra SQL injection)
- Pool de conexões gerenciado

✅ **CORS**
- Configurado apenas para origem do frontend
- Credentials habilitado

✅ **Middleware**
- Validação de token em rotas protegidas
- Verificação de usuário ativo

---

## 🚀 Scripts NPM

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start

# Inicializar banco de dados
npm run init-db

# Testes
npm test
```

---

## 🔧 Variáveis de Ambiente

```env
# Servidor
PORT=5000
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=tradernex

# JWT
JWT_SECRET=chave_secreta_forte
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5174
```

---

## 📈 Próximas Melhorias Sugeridas

### Funcionalidades
- [ ] Sistema de notificações
- [ ] Integração com provedores de email
- [ ] Integração com gateways de pagamento
- [ ] API de sincronização com MT4/MT5
- [ ] Sistema de webhooks
- [ ] Upload de documentos
- [ ] 2FA (Two-Factor Authentication)

### Performance
- [ ] Rate limiting
- [ ] Cache com Redis
- [ ] Compressão de resposta
- [ ] Paginação otimizada

### Segurança
- [ ] Helmet.js
- [ ] HTTPS obrigatório
- [ ] Logs de auditoria
- [ ] Detecção de tentativas de invasão

### DevOps
- [ ] Docker + Docker Compose
- [ ] CI/CD Pipeline
- [ ] Monitoramento (PM2, New Relic, etc.)
- [ ] Backup automático do banco

---

## 📊 Estatísticas do Projeto

- **Linhas de Código**: ~2,500+
- **Arquivos**: 15
- **Rotas API**: 23
- **Tabelas no Banco**: 13
- **Controllers**: 3
- **Middlewares**: 1
- **Dependências**: 7

---

## 💡 Dicas de Uso

### Testar com cURL
```bash
# Registrar
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha123","firstName":"João","lastName":"Silva"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha123"}'

# Dashboard (com token)
curl -X GET http://localhost:5000/api/dashboard/overview \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Testar com Postman
1. Importe a collection (criar arquivo .json)
2. Configure variável de ambiente com o token
3. Teste todos os endpoints

---

## 🆘 Troubleshooting

### Problema: Erro de conexão com PostgreSQL
```
Solução:
1. Verificar se PostgreSQL está rodando
2. Confirmar credenciais no .env
3. Testar conexão: psql -U postgres -d tradernex
```

### Problema: JWT Token inválido
```
Solução:
1. Verificar se JWT_SECRET está configurado
2. Token expirou? Fazer novo login
3. Verificar formato: Bearer <token>
```

### Problema: Porta 5000 em uso
```
Solução:
1. Alterar PORT no .env
2. Ou matar processo: lsof -ti:5000 | xargs kill
```

---

## 📞 Suporte e Contato

- **Documentação**: README.md
- **Setup Rápido**: SETUP.md
- **Issues**: GitHub Issues
- **Email**: suporte@tradernex.com

---

**TraderNex Backend v1.0.0**
Desenvolvido com ❤️ usando Node.js + PostgreSQL
