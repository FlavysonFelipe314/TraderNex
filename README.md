# 🚀 TraderNex - Plataforma de Gestão de Investimentos

Sistema completo de gestão profissional de investimentos em Forex e Cripto com interface moderna e API REST robusta.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação Rápida](#instalação-rápida)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Documentação](#documentação)
- [Troubleshooting](#troubleshooting)
- [Contribuindo](#contribuindo)

## 🎯 Sobre o Projeto

TraderNex é uma plataforma completa para gestão de investimentos que oferece gestão profissional de contas Forex, análise de performance, integração com Myfxbook e muito mais.

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- ✅ **Autenticação JWT** com verificação de email
- ✅ **Recuperação de Senha** via email com tokens seguros
- ✅ **Perfil do Cliente** completo com gerenciamento de dados pessoais
- ✅ **Senhas Criptografadas** com bcrypt

### 📊 Dashboard e Análise
- ✅ **Dashboard Interativo** com visão geral de investimentos
- ✅ **Estatísticas de Performance** com gráficos e métricas
- ✅ **Relatórios de Performance** detalhados
- ✅ **Faturas e Histórico** de transações

### 💼 Gestão de Investimentos
- ✅ **Gestão de Contas MT4** - Cadastro e gerenciamento de contas Forex
- ✅ **Integração Myfxbook** - Conexão automática com persistência real
- ✅ **Sistema de Planos** - Diferentes planos (Basic, Pro, Premium)
- ✅ **Programa de Indicações** - Sistema de referral com códigos únicos

### 🔗 Integrações
- ✅ **Myfxbook API** - Integração completa com reconexão automática
  - Persistência real de credenciais (criptografadas)
  - Reconexão automática após logout/login
  - Exibição de dados em tempo real (ganho, lucro, drawdown, equity)
  - Trades abertos e histórico de transações

### 🎧 Suporte
- ✅ **Sistema de Tickets** - Atendimento ao cliente integrado
- ✅ **Notificações** - Sistema de alertas

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI moderna
- **Vite** - Build tool e dev server ultra-rápido
- **React Router** - Roteamento SPA
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS utility-first
- **Iconify** - Biblioteca de ícones

### Backend
- **Node.js 18** - Runtime JavaScript
- **Express 5** - Framework web minimalista
- **PostgreSQL 15** - Banco de dados relacional
- **JWT** - Autenticação stateless
- **Bcrypt** - Hash seguro de senhas
- **Nodemailer** - Envio de emails SMTP
- **Swagger** - Documentação interativa da API
- **Crypto** - Criptografia AES-256 para credenciais

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Docker](https://www.docker.com/get-started) (versão 20.10 ou superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0 ou superior)
- [Git](https://git-scm.com/)

## 🚀 Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/tradernex.git
cd tradernex
```

### 2. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

📖 **Template completo**: Veja [docs/ENV-TEMPLATE.md](docs/ENV-TEMPLATE.md)

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
DB_NAME=tradernex

# JWT (Gere uma chave forte!)
JWT_SECRET=sua_chave_secreta_jwt_forte_aqui
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (Opcional - veja docs/CONFIGURAR-EMAIL.md)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
SMTP_FROM=TraderNex <seu_email@gmail.com>

# Criptografia (Opcional - para persistência Myfxbook)
ENCRYPTION_KEY=sua_chave_hex_64_caracteres
```

### 3. Inicie os Containers

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou em modo detached (background)
docker-compose up -d --build
```

### 4. Inicialize o Banco de Dados

```bash
# Executar migrations e seed
docker-compose exec backend npm run init-db
docker-compose exec backend npm run seed

# Executar migração do Myfxbook (se usar integração)
docker-compose exec backend npm run migrate
cd backend && node src/config/runMigrationPassword.js
```

## ⚙️ Configuração

### Configuração de Email

Para habilitar envio de emails (verificação de conta, recuperação de senha):

📖 **Guia completo**: [docs/CONFIGURAR-EMAIL.md](docs/CONFIGURAR-EMAIL.md)

**Gmail (Recomendado):**
1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App": https://myaccount.google.com/apppasswords
3. Use a senha gerada no `SMTP_PASSWORD`

### Integração Myfxbook

Para conectar sua conta Myfxbook e ter persistência real:

📖 **Guia completo**: [docs/COMO-CONECTAR-MYFXBOOK.md](docs/COMO-CONECTAR-MYFXBOOK.md)

📖 **Sobre persistência**: [docs/PERSISTENCIA-MYFXBOOK.md](docs/PERSISTENCIA-MYFXBOOK.md)

**Características:**
- ✅ Credenciais criptografadas (AES-256)
- ✅ Reconexão automática após logout/login
- ✅ Dados exibidos automaticamente ao fazer login
- ✅ Não precisa reconectar manualmente

## 🎮 Uso

### Desenvolvimento

```bash
# Iniciar todos os serviços
docker-compose up

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar serviços
docker-compose down

# Reconstruir após mudanças
docker-compose up --build
```

### Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health
- **PostgreSQL**: localhost:5432

### Hot Reload

O projeto está configurado com hot reload:
- **Backend**: Reinicia automaticamente com nodemon ao salvar arquivos
- **Frontend**: Recarrega automaticamente com Vite ao salvar arquivos

## 📁 Estrutura do Projeto

```
tradernex/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── config/         # Configurações (DB, Swagger, migrations)
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (email, myfxbook)
│   │   ├── utils/          # Utilitários (criptografia)
│   │   └── server.js       # Servidor Express
│   ├── tests/              # Testes unitários
│   ├── Dockerfile          # Dockerfile produção
│   ├── Dockerfile.dev      # Dockerfile desenvolvimento
│   └── package.json
│
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Context API (Auth, Sidebar)
│   │   ├── page/          # Páginas da aplicação
│   │   ├── services/      # Serviços API
│   │   └── App.jsx        # Componente principal
│   ├── tests/             # Testes unitários
│   ├── Dockerfile          # Dockerfile produção
│   ├── Dockerfile.dev     # Dockerfile desenvolvimento
│   └── package.json
│
├── docs/                   # Documentação
│   ├── CONFIGURAR-EMAIL.md
│   ├── COMO-CONECTAR-MYFXBOOK.md
│   ├── PERSISTENCIA-MYFXBOOK.md
│   ├── ENV-TEMPLATE.md
│   ├── SETUP-QUICK.md
│   └── ...
│
├── docker-compose.yml      # Orquestração Docker
├── .env                    # Variáveis de ambiente (não commitado)
├── .gitignore             # Arquivos ignorados pelo Git
└── README.md             # Este arquivo
```

## 📡 API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha
- `POST /api/auth/reset-password` - Redefinir senha
- `POST /api/auth/verify-email` - Verificar email
- `GET /api/auth/profile` - Obter perfil (protegido)
- `PUT /api/auth/profile` - Atualizar perfil (protegido)
- `POST /api/auth/logout` - Logout

#### Dashboard
- `GET /api/dashboard/overview` - Visão geral
- `GET /api/dashboard/performance` - Estatísticas de performance
- `GET /api/dashboard/mt4-accounts` - Listar contas MT4
- `POST /api/dashboard/mt4-accounts` - Adicionar conta MT4

#### Myfxbook
- `POST /api/myfxbook/connect` - Conectar conta Myfxbook
- `POST /api/myfxbook/disconnect` - Desconectar conta
- `GET /api/myfxbook/status` - Status da conexão
- `GET /api/myfxbook/accounts` - Listar contas Myfxbook
- `GET /api/myfxbook/accounts/:accountId/data` - Dados de uma conta

#### Suporte
- `POST /api/support/tickets` - Criar ticket
- `GET /api/support/tickets` - Listar tickets
- `GET /api/support/tickets/:id` - Detalhes do ticket

📖 **Documentação completa**: Acesse http://localhost:5000/api-docs após iniciar o servidor

## 📚 Documentação

### 📖 Guias Principais

- **[Setup Rápido](docs/SETUP-QUICK.md)** - Comece em 5 minutos
- **[Template de Variáveis de Ambiente](docs/ENV-TEMPLATE.md)** - Todas as variáveis explicadas
- **[Configurar Email](docs/CONFIGURAR-EMAIL.md)** - Como configurar SMTP
- **[Docker Compose](docs/DOCKER-COMPOSE.md)** - Detalhes sobre containers

### 🔗 Integrações

- **[Conectar Myfxbook](docs/COMO-CONECTAR-MYFXBOOK.md)** - Passo a passo completo
- **[Persistência Myfxbook](docs/PERSISTENCIA-MYFXBOOK.md)** - Como funciona a reconexão automática

### 🛠️ Desenvolvimento

- **[Contribuindo](docs/CONTRIBUTING.md)** - Guia para contribuir
- **[Changelog](docs/CHANGELOG.md)** - Histórico de mudanças
- **[Testes](docs/README-TESTES.md)** - Como executar testes

### 🔧 Troubleshooting

- **[Solução Rápida](docs/SOLUCAO-RAPIDA.md)** - Soluções comuns
- **[Debug Frontend](docs/DEBUG-FRONTEND.md)** - Debug do frontend
- **[Fix Docker](docs/FIX-DOCKER.md)** - Problemas com Docker

### 📋 Backend

- **[Overview Backend](backend/OVERVIEW.md)** - Visão geral da API
- **[Email Setup](backend/EMAIL-SETUP.md)** - Configuração detalhada de email
- **[Swagger](backend/SWAGGER.md)** - Documentação da API

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Tokens JWT com expiração configurável
- ✅ Verificação de email obrigatória
- ✅ Tokens de reset únicos e não reutilizáveis
- ✅ Validação de dados com express-validator
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ CORS configurado
- ✅ Credenciais Myfxbook criptografadas (AES-256-CBC)

## 🧪 Desenvolvimento

### Comandos Úteis

```bash
# Ver logs do backend
docker-compose logs -f backend

# Ver logs do frontend
docker-compose logs -f frontend

# Executar comando no backend
docker-compose exec backend npm run <comando>

# Executar comando no frontend
docker-compose exec frontend npm run <comando>

# Reconstruir apenas um serviço
docker-compose build backend
docker-compose up -d backend

# Limpar tudo (CUIDADO: remove volumes!)
docker-compose down -v
```

### Scripts Disponíveis

#### Backend
- `npm run dev` - Inicia em modo desenvolvimento (nodemon)
- `npm start` - Inicia em modo produção
- `npm run init-db` - Inicializa o banco de dados
- `npm run seed` - Popula o banco com dados iniciais
- `npm run migrate` - Executa migrações do banco

#### Frontend
- `npm run dev` - Inicia servidor de desenvolvimento (Vite)
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção

## 🐛 Troubleshooting

### Problemas Comuns

**Backend não inicia:**
- Verifique se o PostgreSQL está rodando: `docker-compose ps`
- Verifique as variáveis de ambiente no `.env`
- Veja os logs: `docker-compose logs backend`

**Frontend não carrega:**
- Verifique se o backend está rodando
- Limpe o cache do navegador
- Veja os logs: `docker-compose logs frontend`

**Emails não são enviados:**
- Verifique configuração SMTP no `.env`
- Veja [docs/CONFIGURAR-EMAIL.md](docs/CONFIGURAR-EMAIL.md)
- Verifique logs: `docker-compose logs backend | grep -i email`

**Myfxbook não conecta:**
- Execute a migração: `docker-compose exec backend npm run migrate`
- Veja [docs/COMO-CONECTAR-MYFXBOOK.md](docs/COMO-CONECTAR-MYFXBOOK.md)
- Verifique logs: `docker-compose logs backend | grep -i myfxbook`

📖 **Mais soluções**: [docs/SOLUCAO-RAPIDA.md](docs/SOLUCAO-RAPIDA.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

📖 **Guia completo**: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para questões e suporte:
- Abra uma issue no GitHub
- Consulte a documentação em `docs/`
- Veja os guias de troubleshooting

## 🎯 Próximas Melhorias

- [ ] Sistema de notificações em tempo real
- [ ] Integração com gateways de pagamento
- [ ] API de sincronização com MT4/MT5
- [ ] Sistema de webhooks
- [ ] Upload de documentos
- [ ] 2FA (Two-Factor Authentication)
- [ ] Gráfico de ganho diário no Myfxbook

---

**TraderNex** - Gestão profissional de Forex e Cripto com IA 🚀
#   T r a d e r N e x  
 