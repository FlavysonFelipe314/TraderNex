# Guia de Testes - TraderNex

Este documento descreve a estrutura de testes unitários implementada no projeto TraderNex.

## Estrutura de Testes

### Backend

Os testes do backend estão localizados em `backend/tests/` e utilizam **Jest** como framework de testes.

```
backend/
├── tests/
│   ├── setup.js                    # Configuração global dos testes
│   ├── mocks/
│   │   ├── database.js             # Mock do pool de conexão
│   │   └── emailService.js         # Mock do serviço de email
│   └── unit/
│       ├── controllers/
│       │   ├── authController.test.js
│       │   ├── dashboardController.test.js
│       │   └── supportController.test.js
│       ├── services/
│       │   └── emailService.test.js
│       └── middleware/
│           └── auth.test.js
```

### Frontend

Os testes do frontend estão localizados em `frontend/tests/` e utilizam **Vitest** e **React Testing Library**.

```
frontend/
├── tests/
│   ├── setup.js                    # Configuração global dos testes
│   ├── mocks/
│   │   └── api.js                  # Mock do axios
│   └── unit/
│       ├── services/
│       │   ├── api.test.js
│       │   ├── dashboardService.test.js
│       │   ├── profileService.test.js
│       │   └── supportService.test.js
│       ├── contexts/
│       │   └── AuthContext.test.jsx
│       └── components/
│           └── ProtectedRoute.test.jsx
```

## Como Executar os Testes

### Backend

```bash
cd backend

# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar apenas testes unitários
npm run test:unit

# Executar testes com cobertura
npm test -- --coverage
```

### Frontend

```bash
cd frontend

# Executar todos os testes
npm test

# Executar testes com interface gráfica
npm run test:ui

# Executar testes com cobertura
npm run test:coverage
```

## Cobertura de Testes

### Backend

Os testes cobrem:

- ✅ **Controllers:**
  - `authController`: register, login, forgotPassword, resetPassword, verifyEmail, getProfile, updateProfile, updatePassword, logout
  - `dashboardController`: getDashboardData, getPerformanceStats, getMT4Accounts, addMT4Account, getInvestmentPlans, getUserInvestments, getTransactions, getInvoices, getReferrals
  - `supportController`: createTicket, getUserTickets, getTicketDetails, addTicketResponse, closeTicket

- ✅ **Services:**
  - `emailService`: sendVerificationEmail, sendPasswordResetEmail

- ✅ **Middleware:**
  - `auth`: autenticação JWT, validação de tokens

### Frontend

Os testes cobrem:

- ✅ **Services:**
  - `api`: interceptors, adição de tokens, tratamento de erros
  - `dashboardService`: todas as funções de busca de dados
  - `profileService`: updateProfile, updatePassword
  - `supportService`: todas as operações de tickets

- ✅ **Contexts:**
  - `AuthContext`: login, register, forgotPassword, resetPassword, verifyEmail, getProfile, updateProfile, logout

- ✅ **Components:**
  - `ProtectedRoute`: proteção de rotas autenticadas

## Estrutura dos Testes

### Exemplo de Teste do Backend

```javascript
describe('AuthController', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    // Arrange
    req.body = { email: 'test@example.com', password: 'password123' };
    
    // Act
    await authController.register(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

### Exemplo de Teste do Frontend

```javascript
describe('DashboardService', () => {
  it('deve buscar dados do dashboard com sucesso', async () => {
    // Arrange
    api.get.mockResolvedValueOnce({ data: mockData });
    
    // Act
    const result = await dashboardService.getDashboardData();
    
    // Assert
    expect(result.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/api/dashboard/overview?period=30d');
  });
});
```

## Mocks e Stubs

### Backend

- **Database Pool**: Mockado para evitar conexões reais ao banco
- **Email Service**: Mockado para evitar envio real de emails
- **JWT**: Mockado para testes de autenticação
- **Bcrypt**: Mockado para testes de hash de senha

### Frontend

- **Axios**: Mockado para simular requisições HTTP
- **LocalStorage**: Mockado para testes de persistência
- **React Router**: Mockado para testes de navegação

## Boas Práticas

1. **Isolamento**: Cada teste é independente e não depende de outros
2. **Limpeza**: Mocks são limpos após cada teste
3. **Cobertura**: Testes cobrem casos de sucesso e erro
4. **Nomenclatura**: Testes descrevem claramente o que estão testando
5. **Arrange-Act-Assert**: Estrutura clara dos testes

## Próximos Passos

Para aumentar a cobertura de testes, considere adicionar:

- [ ] Testes de integração
- [ ] Testes end-to-end (E2E)
- [ ] Testes de componentes React mais complexos
- [ ] Testes de performance
- [ ] Testes de acessibilidade

## Troubleshooting

### Erros Comuns

1. **"Cannot find module"**: Execute `npm install` no diretório do backend/frontend
2. **"JWT_SECRET is not defined"**: Verifique se o arquivo `tests/setup.js` está configurado corretamente
3. **"localStorage is not defined"**: Verifique se o mock do localStorage está configurado no `tests/setup.js`

### Dependências

Certifique-se de que todas as dependências de desenvolvimento estão instaladas:

**Backend:**
- jest
- supertest
- @types/jest

**Frontend:**
- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom

## Contribuindo

Ao adicionar novos recursos, certifique-se de:

1. Criar testes unitários correspondentes
2. Manter a cobertura de testes acima de 80%
3. Seguir os padrões estabelecidos nos testes existentes
4. Executar todos os testes antes de fazer commit

