# Swagger API Documentation

A documentação da API TraderNex está disponível através do Swagger UI.

## Instalação

Instale as dependências do Swagger:

```bash
npm install
```

As seguintes dependências foram adicionadas:
- `swagger-jsdoc`: Para gerar a especificação OpenAPI a partir de comentários JSDoc
- `swagger-ui-express`: Para servir a interface Swagger UI

## Acessar a Documentação

Após iniciar o servidor, acesse:

```
http://localhost:5000/api-docs
```

## Estrutura da Documentação

A documentação está organizada nas seguintes seções:

### 1. **Auth** - Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Autenticar usuário
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha
- `POST /api/auth/reset-password` - Redefinir senha
- `POST /api/auth/verify-email` - Verificar email
- `GET /api/auth/profile` - Obter perfil do usuário (protegido)

### 2. **Dashboard** - Dashboard e Dados
- `GET /api/dashboard/overview` - Dados do dashboard
- `GET /api/dashboard/performance` - Estatísticas de performance
- `GET /api/dashboard/mt4-accounts` - Listar contas MT4
- `POST /api/dashboard/mt4-accounts` - Adicionar conta MT4
- `GET /api/dashboard/investment-plans` - Planos de investimento
- `GET /api/dashboard/investments` - Investimentos do usuário
- `GET /api/dashboard/transactions` - Transações
- `GET /api/dashboard/invoices` - Faturas
- `GET /api/dashboard/referrals` - Dados de indicações

### 3. **Support** - Suporte
- `POST /api/support/tickets` - Criar ticket
- `GET /api/support/tickets` - Listar tickets
- `GET /api/support/tickets/{ticketId}` - Detalhes do ticket
- `POST /api/support/tickets/{ticketId}/responses` - Adicionar resposta
- `PATCH /api/support/tickets/{ticketId}/close` - Fechar ticket

### 4. **Health** - Saúde da API
- `GET /health` - Verificar status da API

## Autenticação

A maioria dos endpoints requer autenticação via JWT Bearer Token.

Para usar a autenticação no Swagger UI:

1. Faça login através do endpoint `/api/auth/login`
2. Copie o token retornado no campo `data.token`
3. Clique no botão **Authorize** no topo da página Swagger
4. Cole o token no campo "Value" (formato: `Bearer seu_token_aqui` ou apenas `seu_token_aqui`)
5. Clique em **Authorize** e depois em **Close**

Agora você pode testar os endpoints protegidos diretamente no Swagger UI.

## Schemas Definidos

A documentação inclui os seguintes schemas reutilizáveis:

- `User` - Dados do usuário
- `LoginRequest` - Requisição de login
- `RegisterRequest` - Requisição de registro
- `LoginResponse` - Resposta de login
- `DashboardData` - Dados do dashboard
- `MT4Account` - Conta MT4
- `Error` - Formato de erro
- `Success` - Formato de sucesso

## Personalização

A configuração do Swagger está em `src/config/swagger.js`. Você pode personalizar:

- Informações da API (título, versão, descrição)
- Servidores (URLs de desenvolvimento e produção)
- Schemas e componentes
- Tags e categorias

## Adicionar Novos Endpoints

Para documentar novos endpoints, adicione comentários JSDoc antes da rota:

```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Descrição do endpoint
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.get('/example', controller.example);
```

## Exportar Especificação OpenAPI

A especificação OpenAPI pode ser exportada em JSON ou YAML:

```bash
# Acesse diretamente no navegador:
http://localhost:5000/api-docs/swagger.json
```

Isso retorna a especificação completa em formato JSON, que pode ser importada em outras ferramentas como Postman, Insomnia, ou geradores de clientes.
