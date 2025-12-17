import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import api from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: {
              id: 1,
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe'
            }
          },
          message: 'Login realizado com sucesso'
        }
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginResult = await result.current.login('test@example.com', 'password123');

      expect(loginResult.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(result.current.user).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('deve tratar erro de login', async () => {
      const error = {
        response: {
          data: {
            message: 'Email ou senha incorretos'
          }
        }
      };

      api.post.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginResult = await result.current.login('test@example.com', 'wrong');

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('Email ou senha incorretos');
    });

    it('deve tratar erros de validação', async () => {
      const error = {
        response: {
          data: {
            errors: [
              { message: 'Email inválido' },
              { msg: 'Senha obrigatória' }
            ]
          }
        }
      };

      api.post.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginResult = await result.current.login('invalid', '');

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toContain('Email inválido');
    });
  });

  describe('register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: {
              id: 1,
              email: 'new@example.com',
              firstName: 'Jane',
              lastName: 'Doe'
            }
          },
          message: 'Usuário registrado com sucesso'
        }
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const registerResult = await result.current.register(
        'new@example.com',
        'password123',
        'Jane',
        'Doe',
        '123456789',
        'BR'
      );

      expect(registerResult.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(result.current.user).toBeTruthy();
    });

    it('deve tratar erro de registro', async () => {
      const error = {
        response: {
          data: {
            message: 'Este email já está cadastrado'
          }
        }
      };

      api.post.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const registerResult = await result.current.register(
        'existing@example.com',
        'password123',
        'John',
        'Doe'
      );

      expect(registerResult.success).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('deve solicitar recuperação de senha com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Email enviado com sucesso'
        }
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const forgotResult = await result.current.forgotPassword('test@example.com');

      expect(forgotResult.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com'
      });
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Senha redefinida com sucesso'
        }
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const resetResult = await result.current.resetPassword('token123', 'newPassword123');

      expect(resetResult.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'token123',
        password: 'newPassword123'
      });
    });
  });

  describe('verifyEmail', () => {
    it('deve verificar email com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Email verificado com sucesso'
        }
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const verifyResult = await result.current.verifyEmail('token123');

      expect(verifyResult.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/auth/verify-email', {
        token: 'token123'
      });
    });
  });

  describe('getProfile', () => {
    it('deve buscar perfil com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            balance: '1000.50',
            total_invested: '5000.00',
            email_verified: true
          }
        }
      };

      api.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const profileResult = await result.current.getProfile();

      expect(profileResult.success).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.user.balance).toBe(1000.50);
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'test@example.com',
            email_verified: true
          },
          message: 'Perfil atualizado com sucesso'
        }
      };

      api.put = vi.fn().mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const updateResult = await result.current.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith'
      });

      expect(updateResult.success).toBe(true);
      expect(result.current.user).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      api.post.mockResolvedValueOnce({ data: { success: true } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      await result.current.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');

      window.location = originalLocation;
    });
  });

  describe('inicialização', () => {
    it('deve carregar usuário do localStorage na inicialização', async () => {
      const userData = { id: 1, email: 'test@example.com' };
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('deve tratar erro ao carregar dados do localStorage', async () => {
      localStorage.setItem('user', 'invalid-json');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });
});



