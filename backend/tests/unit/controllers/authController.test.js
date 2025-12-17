const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const authController = require('../../../src/controllers/authController');
const mockPool = require('../../mocks/database');
const mockEmailService = require('../../mocks/emailService');

// Mock das dependências
jest.mock('../../../src/config/database', () => mockPool);
jest.mock('../../../src/services/emailService', () => mockEmailService);
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('express-validator');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '123456789',
        country: 'BR'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Verificar se usuário existe
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            email: 'test@example.com', 
            first_name: 'John', 
            last_name: 'Doe' 
          }] 
        }) // Inserir usuário
        .mockResolvedValueOnce({ rows: [] }); // Criar perfil
      
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign
        .mockReturnValueOnce('authToken')
        .mockReturnValueOnce('verificationToken');
      mockEmailService.sendVerificationEmail.mockResolvedValue({ success: true });

      await authController.register(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registrado com sucesso')
        })
      );
    });

    it('deve retornar erro se email já estiver cadastrado', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'existing@example.com' }] 
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Este email já está cadastrado.'
        })
      );
    });

    it('deve retornar erro de validação', async () => {
      req.body = {
        email: 'invalid-email',
        password: '123'
      };

      validationResult.mockReturnValue({ 
        isEmpty: () => false,
        array: () => [{ msg: 'Email inválido' }, { msg: 'Senha muito curta' }]
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.any(Array)
        })
      );
    });

    it('deve tratar erros do banco de dados', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Erro ao registrar usuário.'
        })
      );
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        email_verified: true
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      await authController.login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login realizado com sucesso!'
        })
      );
    });

    it('deve retornar erro se usuário não existir', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email ou senha incorretos.'
        })
      );
    });

    it('deve retornar erro se senha estiver incorreta', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        is_active: true,
        email_verified: true
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email ou senha incorretos.'
        })
      );
    });

    it('deve retornar erro se conta estiver desativada', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        is_active: false,
        email_verified: true
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Conta desativada. Entre em contato com o suporte.'
        })
      );
    });

    it('deve retornar erro se email não foi verificado', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        is_active: true,
        email_verified: false
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          requiresVerification: true
        })
      );
    });
  });

  describe('forgotPassword', () => {
    it('deve enviar email de recuperação com sucesso', async () => {
      req.body = { email: 'test@example.com' };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] });
      
      jwt.sign.mockReturnValue('resetToken');
      mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

      await authController.forgotPassword(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve retornar sucesso mesmo se email não existir (por segurança)', async () => {
      req.body = { email: 'nonexistent@example.com' };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await authController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      req.body = {
        token: 'validToken',
        password: 'newPassword123'
      };

      const decoded = { userId: 1, purpose: 'password-reset' };
      jwt.verify.mockReturnValue(decoded);
      
      mockPool.query
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, token: 'validToken', used: false }] 
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      await authController.resetPassword(req, res);

      expect(jwt.verify).toHaveBeenCalledWith('validToken', process.env.JWT_SECRET);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Senha redefinida com sucesso!'
        })
      );
    });

    it('deve retornar erro se token for inválido', async () => {
      req.body = {
        token: 'invalidToken',
        password: 'newPassword123'
      };

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token inválido ou expirado.'
        })
      );
    });

    it('deve retornar erro se token já foi usado', async () => {
      req.body = {
        token: 'usedToken',
        password: 'newPassword123'
      };

      const decoded = { userId: 1, purpose: 'password-reset' };
      jwt.verify.mockReturnValue(decoded);
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token inválido, já utilizado ou expirado.'
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('deve verificar email com sucesso', async () => {
      req.body = { token: 'validToken' };

      const decoded = { 
        userId: 1, 
        email: 'test@example.com', 
        purpose: 'email-verification' 
      };
      
      jwt.verify.mockReturnValue(decoded);
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ email_verified: false }] })
        .mockResolvedValueOnce({ rows: [] });

      await authController.verifyEmail(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email verificado com sucesso!'
        })
      );
    });

    it('deve retornar erro se token for inválido', async () => {
      req.body = { token: 'invalidToken' };

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token inválido ou expirado.'
        })
      );
    });

    it('deve retornar sucesso se email já foi verificado', async () => {
      req.body = { token: 'validToken' };

      const decoded = { 
        userId: 1, 
        purpose: 'email-verification' 
      };
      
      jwt.verify.mockReturnValue(decoded);
      mockPool.query.mockResolvedValueOnce({ rows: [{ email_verified: true }] });

      await authController.verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email já foi verificado anteriormente.'
        })
      );
    });
  });

  describe('getProfile', () => {
    it('deve retornar perfil do usuário com sucesso', async () => {
      req.user = { userId: 1 };

      const mockProfile = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        balance: '1000.50',
        total_invested: '5000.00',
        total_profit: '200.00',
        profit_percentage: '4.00'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockProfile] });

      await authController.getProfile(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 1,
            email: 'test@example.com'
          })
        })
      );
    });

    it('deve retornar erro se usuário não for encontrado', async () => {
      req.user = { userId: 999 };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Usuário não encontrado.'
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      req.user = { userId: 1 };
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '987654321'
      };

      const mockProfile = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [mockProfile] });

      await authController.updateProfile(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Perfil atualizado com sucesso!'
        })
      );
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      req.user = { userId: 1 };
      req.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ password: 'hashedOldPassword' }] })
        .mockResolvedValueOnce({ rows: [] });
      
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      await authController.updatePassword(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Senha atualizada com sucesso!'
        })
      );
    });

    it('deve retornar erro se senha atual estiver incorreta', async () => {
      req.user = { userId: 1 };
      req.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ password: 'hashedOldPassword' }] 
      });
      bcrypt.compare.mockResolvedValue(false);

      await authController.updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Senha atual incorreta.'
        })
      );
    });

    it('deve retornar erro se nova senha for muito curta', async () => {
      req.user = { userId: 1 };
      req.body = {
        currentPassword: 'oldPassword123',
        newPassword: '123'
      };

      await authController.updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A nova senha deve ter no mínimo 6 caracteres.'
        })
      );
    });
  });

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      req.user = { userId: 1 };

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout realizado com sucesso.'
        })
      );
    });
  });
});



