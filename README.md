# 🚀 TraderNex - Plataforma de Gestão de Investimentos

Sistema completo de gestão profissional de investimentos em Forex e Cripto com interface moderna e API REST robusta.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Contribuindo](#contribuindo)

## 🎯 Sobre o Projeto

TraderNex é uma plataforma completa para gestão de investimentos que oferece:

- ✅ **Dashboard Interativo**: Visão geral de investimentos, performance e estatísticas
- ✅ **Gestão de Contas MT4**: Cadastro e gerenciamento de contas Forex
- ✅ **Sistema de Planos**: Diferentes planos de investimento (Basic, Pro, Premium)
- ✅ **Programa de Indicações**: Sistema de referral com códigos únicos
- ✅ **Perfil do Cliente**: Gerenciamento completo de dados pessoais
- ✅ **Sistema de Suporte**: Tickets e atendimento ao cliente
- ✅ **Autenticação Segura**: JWT com verificação de email
- ✅ **Recuperação de Senha**: Via email com tokens seguros

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilização
- **Iconify** - Ícones

### Backend
- **Node.js 18** - Runtime JavaScript
- **Express 5** - Framework web
- **PostgreSQL 15** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Nodemailer** - Envio de emails
- **Swagger** - Documentação da API

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Docker](https://www.docker.com/get-started) (versão 20.10 ou superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0 ou superior)
- [Git](https://git-scm.com/)

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/tradernex.git
cd tradernex
```

### 2. Configure as Variáveis de Ambiente


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
```

## ⚙️ Configuração

### Arquivo .env

Crie um arquivo `.env` na raiz do projeto baseado no template:

📖 **Template completo**: Veja [ENV-TEMPLATE.md](ENV-TEMPLATE.md)

Exemplo básico:

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

# Email (Gmail exemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
SMTP_FROM=TraderNex <seu_email@gmail.com>
```

### Configuração de Email

Para usar Gmail:
1. Ative a verificação em duas etapas
2. Gere uma "Senha de App": https://myaccount.google.com/apppasswords
3. Use a senha gerada no `SMTP_PASSWORD`

📖 **Documentação completa**: Veja [backend/EMAIL-SETUP.md](backend/EMAIL-SETUP.md)

## 🎮 Uso

### Desenvolvimento

```bash
# Iniciar todos os serviços
docker-compose up

# Ver logs
docker-compose logs -f

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
│   │   ├── config/         # Configurações (DB, Swagger)
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (email, etc)
│   │   └── server.js       # Servidor Express
│   ├── Dockerfile          # Dockerfile produção
│   ├── Dockerfile.dev      # Dockerfile desenvolvimento
│   └── package.json
│
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Context API (Auth, etc)
│   │   ├── page/          # Páginas da aplicação
│   │   ├── services/      # Serviços API
│   │   └── App.jsx        # Componente principal
│   ├── Dockerfile          # Dockerfile produção
│   ├── Dockerfile.dev     # Dockerfile desenvolvimento
│   └── package.json
│
├── docker-compose.yml      # Orquestração Docker
├── .env.example           # Exemplo de variáveis de ambiente
├── .gitignore            # Arquivos ignorados pelo Git
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

#### Dashboard
- `GET /api/dashboard/overview` - Visão geral
- `GET /api/dashboard/performance` - Estatísticas de performance
- `GET /api/dashboard/mt4-accounts` - Listar contas MT4
- `POST /api/dashboard/mt4-accounts` - Adicionar conta MT4

📖 **Documentação completa**: Acesse http://localhost:5000/api-docs após iniciar o servidor

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Tokens JWT com expiração
- ✅ Verificação de email obrigatória
- ✅ Tokens de reset únicos e não reutilizáveis
- ✅ Validação de dados com express-validator
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ CORS configurado

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

## 📝 Scripts Disponíveis

### Backend
- `npm run dev` - Inicia em modo desenvolvimento (nodemon)
- `npm start` - Inicia em modo produção
- `npm run init-db` - Inicializa o banco de dados
- `npm run seed` - Popula o banco com dados iniciais

### Frontend
- `npm run dev` - Inicia servidor de desenvolvimento (Vite)
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para questões e suporte:
- Abra uma issue no GitHub
- Consulte a documentação em `backend/EMAIL-SETUP.md` e `DOCKER-COMPOSE.md`

## 🎯 Próximas Melhorias

- [ ] Sistema de notificações em tempo real
- [ ] Integração com gateways de pagamento
- [ ] API de sincronização com MT4/MT5
- [ ] Sistema de webhooks
- [ ] Upload de documentos
- [ ] 2FA (Two-Factor Authentication)

---

**TraderNex** - Gestão profissional de Forex e Cripto com IA 🚀
