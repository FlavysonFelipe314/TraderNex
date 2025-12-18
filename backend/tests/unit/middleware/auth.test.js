const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/middleware/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  it('deve permitir acesso com token válido', () => {
    req.header.mockReturnValue('Bearer valid-token');
    jwt.verify.mockReturnValue({ userId: 1, email: 'test@example.com' });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual({ userId: 1, email: 'test@example.com' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve retornar erro 401 se token não for fornecido', () => {
    req.header.mockReturnValue(undefined);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar erro 401 se header Authorization não existir', () => {
    req.header.mockReturnValue(null);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar erro 401 se token for inválido', () => {
    req.header.mockReturnValue('Bearer invalid-token');
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token inválido ou expirado.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar erro 401 se token estiver expirado', () => {
    req.header.mockReturnValue('Bearer expired-token');
    jwt.verify.mockImplementation(() => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token inválido ou expirado.'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve remover prefixo Bearer do token', () => {
    req.header.mockReturnValue('Bearer token123');
    jwt.verify.mockReturnValue({ userId: 1 });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'test-secret');
    expect(next).toHaveBeenCalled();
  });

  it('deve funcionar com token sem prefixo Bearer', () => {
    req.header.mockReturnValue('token123');
    jwt.verify.mockReturnValue({ userId: 1 });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'test-secret');
    expect(next).toHaveBeenCalled();
  });
});




