import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock do axios
vi.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deve criar instância do axios com configuração correta', async () => {
    const api = (await import('../../../src/services/api')).default;
    
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('deve adicionar token ao header Authorization quando disponível', async () => {
    localStorage.setItem('token', 'test-token-123');
    
    const api = (await import('../../../src/services/api')).default;
    const mockAxiosInstance = axios.create.mock.results[0].value;
    
    // Simular uma requisição
    const config = { headers: {} };
    const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const result = interceptor(config);
    
    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('não deve adicionar token se não estiver no localStorage', async () => {
    localStorage.removeItem('token');
    
    const api = (await import('../../../src/services/api')).default;
    const mockAxiosInstance = axios.create.mock.results[0].value;
    
    const config = { headers: {} };
    const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const result = interceptor(config);
    
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('deve redirecionar para login em caso de erro 401', async () => {
    const api = (await import('../../../src/services/api')).default;
    const mockAxiosInstance = axios.create.mock.results[0].value;
    
    const error = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    };
    
    const interceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Mock do window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
    
    try {
      await interceptor(error);
    } catch (e) {
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');
    }
    
    window.location = originalLocation;
  });

  it('deve rejeitar erro normalmente se não for 401', async () => {
    const api = (await import('../../../src/services/api')).default;
    const mockAxiosInstance = axios.create.mock.results[0].value;
    
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' }
      }
    };
    
    const interceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    await expect(interceptor(error)).rejects.toEqual(error);
  });
});




