const supportController = require('../../../src/controllers/supportController');
const mockPool = require('../../mocks/database');

jest.mock('../../../src/config/database', () => mockPool);

describe('SupportController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1 },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('deve criar ticket com sucesso', async () => {
      req.body = {
        subject: 'Problema com login',
        message: 'Não consigo fazer login',
        priority: 'high'
      };

      const mockTicket = {
        id: 1,
        subject: 'Problema com login',
        message: 'Não consigo fazer login',
        priority: 'high',
        status: 'open'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockTicket] });

      await supportController.createTicket(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Ticket criado com sucesso!'
        })
      );
    });

    it('deve usar prioridade média como padrão', async () => {
      req.body = {
        subject: 'Dúvida',
        message: 'Tenho uma dúvida'
      };

      const mockTicket = { id: 1, priority: 'medium' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockTicket] });

      await supportController.createTicket(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO support_tickets'),
        expect.arrayContaining([1, 'Dúvida', 'Tenho uma dúvida', 'medium'])
      );
    });

    it('deve retornar erro se assunto estiver faltando', async () => {
      req.body = {
        message: 'Mensagem sem assunto'
      };

      await supportController.createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Assunto e mensagem são obrigatórios.'
        })
      );
    });

    it('deve retornar erro se mensagem estiver faltando', async () => {
      req.body = {
        subject: 'Assunto sem mensagem'
      };

      await supportController.createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Assunto e mensagem são obrigatórios.'
        })
      );
    });
  });

  describe('getUserTickets', () => {
    it('deve retornar tickets do usuário com sucesso', async () => {
      const mockTickets = [
        {
          id: 1,
          subject: 'Problema com login',
          status: 'open',
          priority: 'high',
          created_at: new Date()
        },
        {
          id: 2,
          subject: 'Dúvida sobre investimento',
          status: 'closed',
          priority: 'medium',
          created_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockTickets });

      await supportController.getUserTickets(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getTicketDetails', () => {
    it('deve retornar detalhes do ticket com sucesso', async () => {
      req.params.ticketId = '1';

      const mockTicket = {
        id: 1,
        subject: 'Problema com login',
        message: 'Não consigo fazer login',
        status: 'open',
        user_id: 1
      };

      const mockResponses = [
        {
          id: 1,
          message: 'Resposta do suporte',
          is_admin: true,
          created_at: new Date()
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTicket] })
        .mockResolvedValueOnce({ rows: mockResponses });

      await supportController.getTicketDetails(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            ticket: expect.any(Object),
            responses: expect.any(Array)
          })
        })
      );
    });

    it('deve retornar erro se ticket não for encontrado', async () => {
      req.params.ticketId = '999';

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await supportController.getTicketDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket não encontrado.'
        })
      );
    });

    it('deve retornar erro se ticket não pertencer ao usuário', async () => {
      req.params.ticketId = '1';
      req.user.userId = 2;

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await supportController.getTicketDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket não encontrado.'
        })
      );
    });
  });

  describe('addTicketResponse', () => {
    it('deve adicionar resposta ao ticket com sucesso', async () => {
      req.params.ticketId = '1';
      req.body = { message: 'Nova resposta' };

      const mockTicket = {
        id: 1,
        user_id: 1,
        status: 'open'
      };

      const mockResponse = {
        id: 1,
        ticket_id: 1,
        message: 'Nova resposta',
        is_admin: false
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTicket] })
        .mockResolvedValueOnce({ rows: [mockResponse] })
        .mockResolvedValueOnce({ rows: [] });

      await supportController.addTicketResponse(req, res);

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resposta adicionada com sucesso!'
        })
      );
    });

    it('deve retornar erro se mensagem estiver faltando', async () => {
      req.params.ticketId = '1';
      req.body = {};

      await supportController.addTicketResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Mensagem é obrigatória.'
        })
      );
    });

    it('deve retornar erro se ticket não for encontrado', async () => {
      req.params.ticketId = '999';
      req.body = { message: 'Resposta' };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await supportController.addTicketResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket não encontrado.'
        })
      );
    });
  });

  describe('closeTicket', () => {
    it('deve fechar ticket com sucesso', async () => {
      req.params.ticketId = '1';

      const mockTicket = {
        id: 1,
        status: 'closed',
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockTicket] });

      await supportController.closeTicket(req, res);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Ticket fechado com sucesso!'
        })
      );
    });

    it('deve retornar erro se ticket não for encontrado', async () => {
      req.params.ticketId = '999';

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await supportController.closeTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket não encontrado.'
        })
      );
    });

    it('deve retornar erro se ticket não pertencer ao usuário', async () => {
      req.params.ticketId = '1';
      req.user.userId = 2;

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await supportController.closeTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket não encontrado.'
        })
      );
    });
  });
});

