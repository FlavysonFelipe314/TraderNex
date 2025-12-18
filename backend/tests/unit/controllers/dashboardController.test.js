const dashboardController = require('../../../src/controllers/dashboardController');
const mockPool = require('../../mocks/database');

jest.mock('../../../src/config/database', () => mockPool);

describe('DashboardController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1 },
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('deve retornar dados do dashboard com sucesso', async () => {
      const mockProfile = {
        balance: '1000.50',
        total_invested: '5000.00',
        total_profit: '200.00',
        profit_percentage: '4.00',
        account_type: 'premium'
      };

      const mockMT4 = {
        total_accounts: '2',
        total_balance: '2000.00',
        total_equity: '2100.00'
      };

      const mockTransactions = [
        { id: 1, type: 'deposit', amount: '100.00', status: 'completed' }
      ];

      const mockInvestments = {
        active_investments: '3',
        total_invested_amount: '3000.00',
        current_total_value: '3150.00'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockProfile] })
        .mockResolvedValueOnce({ rows: [mockMT4] })
        .mockResolvedValueOnce({ rows: mockTransactions })
        .mockResolvedValueOnce({ rows: [mockInvestments] });

      await dashboardController.getDashboardData(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(4);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            profile: expect.any(Object),
            mt4Accounts: expect.any(Object),
            recentTransactions: expect.any(Array),
            investments: expect.any(Object)
          })
        })
      );
    });

    it('deve retornar erro se perfil não for encontrado', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getDashboardData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Perfil não encontrado.'
        })
      );
    });
  });

  describe('getPerformanceStats', () => {
    it('deve retornar estatísticas de performance para período padrão', async () => {
      const mockStats = [
        {
          report_date: new Date('2024-01-01'),
          total_trades: '10',
          winning_trades: '7',
          losing_trades: '3',
          win_rate: '70.00',
          total_profit: '500.00',
          total_loss: '200.00',
          net_profit: '300.00',
          roi: '6.00'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockStats });

      await dashboardController.getPerformanceStats(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('deve retornar estatísticas para período específico (day)', async () => {
      req.query = { period: 'day' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getPerformanceStats(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve retornar estatísticas para período específico (week)', async () => {
      req.query = { period: 'week' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getPerformanceStats(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve retornar estatísticas para período específico (month)', async () => {
      req.query = { period: 'month' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getPerformanceStats(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve retornar estatísticas para período específico (year)', async () => {
      req.query = { period: 'year' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getPerformanceStats(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('getMT4Accounts', () => {
    it('deve retornar contas MT4 com sucesso', async () => {
      const mockAccounts = [
        {
          id: 1,
          account_number: '123456',
          account_name: 'MT4-123456',
          broker: 'Broker1',
          balance: '1000.00'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockAccounts });

      await dashboardController.getMT4Accounts(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('addMT4Account', () => {
    it('deve adicionar conta MT4 com sucesso', async () => {
      req.body = {
        accountNumber: '123456',
        accountName: 'My Account',
        broker: 'Broker1',
        server: 'Server1',
        balance: '1000.00',
        currency: 'USD'
      };

      const mockAccount = {
        id: 1,
        account_number: '123456',
        account_name: 'My Account',
        broker: 'Broker1'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockAccount] });

      await dashboardController.addMT4Account(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Conta MT4 adicionada com sucesso!'
        })
      );
    });

    it('deve aceitar login como accountNumber', async () => {
      req.body = {
        login: '123456',
        broker: 'Broker1',
        server: 'Server1'
      };

      const mockAccount = { id: 1, account_number: '123456' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockAccount] });

      await dashboardController.addMT4Account(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro se campos obrigatórios estiverem faltando', async () => {
      req.body = {
        accountNumber: '123456'
        // Faltando broker e server
      };

      await dashboardController.addMT4Account(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Número da conta, corretora e servidor são obrigatórios.'
        })
      );
    });
  });

  describe('getInvestmentPlans', () => {
    it('deve retornar planos de investimento com sucesso', async () => {
      const mockPlans = [
        {
          id: 1,
          name: 'Plano Básico',
          min_investment: '1000.00',
          max_investment: '10000.00',
          expected_return: '5.00',
          risk_level: 'low'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockPlans });

      await dashboardController.getInvestmentPlans(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getUserInvestments', () => {
    it('deve retornar investimentos do usuário com sucesso', async () => {
      const mockInvestments = [
        {
          id: 1,
          amount: '1000.00',
          status: 'active',
          plan_name: 'Plano Básico'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockInvestments });

      await dashboardController.getUserInvestments(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getTransactions', () => {
    it('deve retornar transações com sucesso', async () => {
      const mockTransactions = [
        { id: 1, type: 'deposit', amount: '100.00', status: 'completed' }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockTransactions });

      await dashboardController.getTransactions(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('deve filtrar transações por tipo', async () => {
      req.query = { type: 'deposit' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getTransactions(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve filtrar transações por status', async () => {
      req.query = { status: 'completed' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getTransactions(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('deve limitar número de transações', async () => {
      req.query = { limit: '10' };
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await dashboardController.getTransactions(req, res);

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getInvoices', () => {
    it('deve retornar faturas com sucesso', async () => {
      const mockInvoices = [
        {
          id: 1,
          invoice_number: 'INV-001',
          amount: '100.00',
          status: 'paid'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockInvoices });

      await dashboardController.getInvoices(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getReferrals', () => {
    it('deve retornar dados de referências com sucesso', async () => {
      const mockCode = { referral_code: 'TN123456' };
      const mockReferrals = [
        {
          id: 1,
          commission: '50.00',
          commission_paid: true,
          first_name: 'John',
          last_name: 'Doe'
        }
      ];
      const mockStats = {
        total_referrals: '5',
        total_commission: '250.00',
        paid_commission: '200.00'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockCode] })
        .mockResolvedValueOnce({ rows: mockReferrals })
        .mockResolvedValueOnce({ rows: [mockStats] });

      await dashboardController.getReferrals(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            referralCode: expect.any(String),
            referrals: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });
  });
});






