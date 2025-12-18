import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as profileService from '../../../src/services/profileService';
import api from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({
  default: {
    put: vi.fn(),
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '987654321'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          first_name: 'Jane',
          last_name: 'Smith'
        },
        message: 'Perfil atualizado com sucesso'
      };

      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await profileService.updateProfile(profileData);

      expect(api.put).toHaveBeenCalledWith('/api/auth/profile', profileData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(result.message).toBe('Perfil atualizado com sucesso');
    });

    it('deve tratar erros de validação', async () => {
      const profileData = { firstName: '' };

      const error = {
        response: {
          data: {
            errors: [
              { message: 'Nome é obrigatório' },
              { msg: 'Campo inválido' }
            ]
          }
        }
      };

      api.put.mockRejectedValueOnce(error);

      const result = await profileService.updateProfile(profileData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nome é obrigatório');
      expect(result.errors).toBeDefined();
    });

    it('deve tratar outros erros', async () => {
      const profileData = { firstName: 'John' };

      const error = {
        response: {
          data: {
            message: 'Erro ao atualizar perfil'
          }
        }
      };

      api.put.mockRejectedValueOnce(error);

      const result = await profileService.updateProfile(profileData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao atualizar perfil');
    });

    it('deve tratar erro sem resposta', async () => {
      const profileData = { firstName: 'John' };
      api.put.mockRejectedValueOnce(new Error('Network error'));

      const result = await profileService.updateProfile(profileData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao atualizar perfil. Tente novamente.');
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      const mockResponse = {
        success: true,
        message: 'Senha atualizada com sucesso'
      };

      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await profileService.updatePassword('oldPass', 'newPass');

      expect(api.put).toHaveBeenCalledWith('/api/auth/password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass'
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Senha atualizada com sucesso');
    });

    it('deve tratar erros de validação', async () => {
      const error = {
        response: {
          data: {
            errors: [
              { message: 'Senha atual incorreta' }
            ]
          }
        }
      };

      api.put.mockRejectedValueOnce(error);

      const result = await profileService.updatePassword('wrong', 'new');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Senha atual incorreta');
    });

    it('deve tratar outros erros', async () => {
      const error = {
        response: {
          data: {
            message: 'Erro ao atualizar senha'
          }
        }
      };

      api.put.mockRejectedValueOnce(error);

      const result = await profileService.updatePassword('old', 'new');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao atualizar senha');
    });

    it('deve tratar erro sem resposta', async () => {
      api.put.mockRejectedValueOnce(new Error('Network error'));

      const result = await profileService.updatePassword('old', 'new');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao atualizar senha. Tente novamente.');
    });
  });
});






