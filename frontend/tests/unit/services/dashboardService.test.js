import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dashboardService from '../../../src/services/dashboardService';
import api from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('deve buscar dados do dashboard com sucesso', async () => {
      const mockData = {
        success: true,
        data: {
          profile: { balance: 1000 },
          mt4Accounts: { totalAccounts: 2 },
          recentTransactions: [],
          investments: {}
        }
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getDashboardData('30d');

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/overview?period=30d');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });

    it('deve tratar erro ao buscar dados do dashboard', async () => {
      const error = {
        response: {
          data: { message: 'Erro ao buscar dados' }
        }
      };

      api.get.mockRejectedValueOnce(error);

      const result = await dashboardService.getDashboardData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao buscar dados');
    });
  });

  describe('getPerformanceStats', () => {
    it('deve buscar estatísticas de performance com sucesso', async () => {
      const mockData = {
        success: true,
        data: [{ report_date: '2024-01-01', net_profit: 100 }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getPerformanceStats('7d');

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/performance?period=7d');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });

    it('deve tratar erro ao buscar estatísticas', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await dashboardService.getPerformanceStats();

      expect(result.success).toBe(false);
    });
  });

  describe('getMT4Accounts', () => {
    it('deve buscar contas MT4 com sucesso', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, account_number: '123456' }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getMT4Accounts();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/mt4-accounts');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });
  });

  describe('addMT4Account', () => {
    it('deve adicionar conta MT4 com sucesso', async () => {
      const accountData = {
        accountNumber: '123456',
        broker: 'Broker1',
        server: 'Server1'
      };

      const mockData = {
        success: true,
        data: { id: 1, ...accountData },
        message: 'Conta adicionada com sucesso'
      };

      api.post.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.addMT4Account(accountData);

      expect(api.post).toHaveBeenCalledWith('/api/dashboard/mt4-accounts', accountData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });

    it('deve tratar erro ao adicionar conta', async () => {
      const accountData = { accountNumber: '123456' };
      api.post.mockRejectedValueOnce(new Error('Validation error'));

      const result = await dashboardService.addMT4Account(accountData);

      expect(result.success).toBe(false);
    });
  });

  describe('getInvestmentPlans', () => {
    it('deve buscar planos de investimento com sucesso', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, name: 'Plano Básico' }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getInvestmentPlans();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/investment-plans');
      expect(result.success).toBe(true);
    });
  });

  describe('getUserInvestments', () => {
    it('deve buscar investimentos do usuário com sucesso', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, amount: 1000 }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getUserInvestments();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/investments');
      expect(result.success).toBe(true);
    });
  });

  describe('getTransactions', () => {
    it('deve buscar transações sem filtros', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, type: 'deposit' }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getTransactions();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/transactions?');
      expect(result.success).toBe(true);
    });

    it('deve buscar transações com filtros', async () => {
      const filters = { type: 'deposit', status: 'completed', limit: 10 };
      const mockData = { success: true, data: [] };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getTransactions(filters);

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/transactions?')
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getInvoices', () => {
    it('deve buscar faturas com sucesso', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, invoice_number: 'INV-001' }]
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getInvoices();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/invoices');
      expect(result.success).toBe(true);
    });
  });

  describe('getReferrals', () => {
    it('deve buscar dados de referências com sucesso', async () => {
      const mockData = {
        success: true,
        data: {
          referralCode: 'TN123456',
          referrals: [],
          stats: { total_referrals: 5 }
        }
      };

      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await dashboardService.getReferrals();

      expect(api.get).toHaveBeenCalledWith('/api/dashboard/referrals');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });
  });
});






