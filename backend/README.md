# TraderNex Backend API

Backend Node.js com PostgreSQL para a plataforma TraderNex - Sistema de gestão profissional de investimentos em Forex e Cripto com IA.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Express Validator** - Validação de dados

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando.

Crie um banco de dados:

```sql
CREATE DATABASE tradernex;
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=tradernex

# JWT Configuration
JWT_SECRET=sua_chave_secreta_jwt_aqui
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5174
```

### 4. Criar Schema do Banco de Dados

Execute o script SQL para criar as tabelas:

```bash
psql -U postgres -d tradernex -f src/config/schema.sql
```

Ou conecte ao PostgreSQL e execute manualmente:

```bash
psql -U postgres -d tradernex
```

Depois copie e cole o conteúdo do arquivo `src/config/schema.sql`.

## 🏃 Executar o Servidor

### Modo Desenvolvimento (com hot-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

O servidor estará rodando em: `http://localhost:5000`

## 📡 Endpoints da API

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/register` | Registrar novo usuário | Não |
| POST | `/login` | Login de usuário | Não |
| POST | `/forgot-password` | Solicitar reset de senha | Não |
| POST | `/reset-password` | Redefinir senha | Não |
| POST | `/verify-email` | Verificar email | Não |
| GET | `/profile` | Obter perfil do usuário | Sim |

### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/overview` | Dados gerais do dashboard | Sim |
| GET | `/performance` | Estatísticas de performance | Sim |
| GET | `/mt4-accounts` | Listar contas MT4 | Sim |
| POST | `/mt4-accounts` | Adicionar conta MT4 | Sim |
| GET | `/investment-plans` | Listar planos de investimento | Sim |
| GET | `/investments` | Listar investimentos do usuário | Sim |
| GET | `/transactions` | Listar transações | Sim |
| GET | `/invoices` | Listar faturas | Sim |
| GET | `/referrals` | Dados do programa de referência | Sim |

### Suporte (`/api/support`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/tickets` | Criar ticket de suporte | Sim |
| GET | `/tickets` | Listar tickets do usuário | Sim |
| GET | `/tickets/:id` | Obter detalhes do ticket | Sim |
| POST | `/tickets/:id/responses` | Adicionar resposta ao ticket | Sim |
| PATCH | `/tickets/:id/close` | Fechar ticket | Sim |

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

### Como usar:

1. Faça login ou registre-se para obter um token
2. Inclua o token no header `Authorization` de suas requisições:

```
Authorization: Bearer seu_token_aqui
```

## 📦 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Configuração do PostgreSQL
│   │   └── schema.sql        # Schema do banco de dados
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   └── supportController.js
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticação
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── supportRoutes.js
│   └── server.js             # Arquivo principal do servidor
├── .env                       # Variáveis de ambiente (não versionado)
├── .env.example              # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## 🗄️ Modelo de Dados

### Principais Tabelas:

- **users** - Usuários do sistema
- **client_profiles** - Perfis detalhados dos clientes
- **mt4_accounts** - Contas MetaTrader 4
- **investment_plans** - Planos de investimento disponíveis
- **user_investments** - Investimentos dos usuários
- **transactions** - Histórico de transações
- **invoices** - Faturas geradas
- **performance_reports** - Relatórios de performance
- **referrals** - Sistema de referência
- **support_tickets** - Tickets de suporte
- **support_responses** - Respostas aos tickets

## 🧪 Testando a API

### Health Check

```bash
curl http://localhost:5000/health
```

### Registrar Usuário

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "firstName": "João",
    "lastName": "Silva",
    "phone": "+5511999999999",
    "country": "Brasil"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

## 🔒 Segurança

- Senhas são criptografadas com bcrypt
- Autenticação via JWT
- Validação de dados com express-validator
- CORS configurado
- Proteção contra SQL Injection (usando prepared statements)

## 📝 Notas Importantes

1. **Em Produção:**
   - Altere o `JWT_SECRET` para uma chave forte e única
   - Configure SSL/TLS no PostgreSQL
   - Use variáveis de ambiente seguras
   - Implemente rate limiting
   - Configure logs apropriados
   - Adicione monitoramento

2. **Email:**
   - O sistema está preparado para envio de emails (reset de senha, verificação)
   - Integre um serviço de email (SendGrid, AWS SES, etc.)

3. **Pagamentos:**
   - Integre com gateways de pagamento (Stripe, PayPal, etc.)
   - Implemente webhooks para processar pagamentos

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para questões e suporte, entre em contato através do sistema de tickets ou email.

---

**TraderNex** - Gestão profissional de Forex e Cripto com IA 🚀
