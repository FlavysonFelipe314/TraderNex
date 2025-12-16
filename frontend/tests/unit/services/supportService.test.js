import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as supportService from '../../../src/services/supportService';
import api from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('SupportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('deve criar ticket com sucesso', async () => {
      const ticketData = {
        subject: 'Problema com login',
        message: 'Não consigo fazer login',
        priority: 'high'
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...ticketData },
        message: 'Ticket criado com sucesso'
      };

      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.createTicket(ticketData);

      expect(api.post).toHaveBeenCalledWith('/api/support/tickets', ticketData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('deve tratar erro ao criar ticket', async () => {
      const ticketData = { subject: 'Test', message: 'Test' };
      const error = {
        response: {
          data: { message: 'Erro ao criar ticket' }
        }
      };

      api.post.mockRejectedValueOnce(error);

      const result = await supportService.createTicket(ticketData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao criar ticket');
    });
  });

  describe('getUserTickets', () => {
    it('deve buscar tickets sem filtro de status', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, subject: 'Ticket 1', status: 'open' },
          { id: 2, subject: 'Ticket 2', status: 'closed' }
        ]
      };

      api.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.getUserTickets();

      expect(api.get).toHaveBeenCalledWith('/api/support/tickets');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('deve buscar tickets com filtro de status', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, subject: 'Ticket 1', status: 'open' }]
      };

      api.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.getUserTickets('open');

      expect(api.get).toHaveBeenCalledWith('/api/support/tickets?status=open');
      expect(result.success).toBe(true);
    });

    it('deve tratar erro ao buscar tickets', async () => {
      const error = {
        response: {
          data: { message: 'Erro ao buscar tickets' }
        }
      };

      api.get.mockRejectedValueOnce(error);

      const result = await supportService.getUserTickets();

      expect(result.success).toBe(false);
    });
  });

  describe('getTicketDetails', () => {
    it('deve buscar detalhes do ticket com sucesso', async () => {
      const ticketId = 1;
      const mockResponse = {
        success: true,
        data: {
          ticket: { id: 1, subject: 'Test', message: 'Test message' },
          responses: []
        }
      };

      api.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.getTicketDetails(ticketId);

      expect(api.get).toHaveBeenCalledWith('/api/support/tickets/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('deve tratar erro ao buscar detalhes', async () => {
      const error = {
        response: {
          data: { message: 'Ticket não encontrado' }
        }
      };

      api.get.mockRejectedValueOnce(error);

      const result = await supportService.getTicketDetails(999);

      expect(result.success).toBe(false);
    });
  });

  describe('addTicketResponse', () => {
    it('deve adicionar resposta ao ticket com sucesso', async () => {
      const ticketId = 1;
      const message = 'Nova resposta';

      const mockResponse = {
        success: true,
        data: { id: 1, message, ticket_id: ticketId },
        message: 'Resposta adicionada com sucesso'
      };

      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.addTicketResponse(ticketId, message);

      expect(api.post).toHaveBeenCalledWith(
        '/api/support/tickets/1/responses',
        { message }
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('deve tratar erro ao adicionar resposta', async () => {
      const error = {
        response: {
          data: { message: 'Erro ao adicionar resposta' }
        }
      };

      api.post.mockRejectedValueOnce(error);

      const result = await supportService.addTicketResponse(1, 'Test');

      expect(result.success).toBe(false);
    });
  });

  describe('closeTicket', () => {
    it('deve fechar ticket com sucesso', async () => {
      const ticketId = 1;
      const mockResponse = {
        success: true,
        data: { id: 1, status: 'closed' },
        message: 'Ticket fechado com sucesso'
      };

      api.patch.mockResolvedValueOnce({ data: mockResponse });

      const result = await supportService.closeTicket(ticketId);

      expect(api.patch).toHaveBeenCalledWith('/api/support/tickets/1/close');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('closed');
    });

    it('deve tratar erro ao fechar ticket', async () => {
      const error = {
        response: {
          data: { message: 'Erro ao fechar ticket' }
        }
      };

      api.patch.mockRejectedValueOnce(error);

      const result = await supportService.closeTicket(1);

      expect(result.success).toBe(false);
    });
  });
});

