const pool = require('../config/database');

// Criar ticket de suporte
exports.createTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Assunto e mensagem são obrigatórios.'
      });
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, subject, message, priority || 'medium']
    );

    res.status(201).json({
      success: true,
      message: 'Ticket criado com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar ticket.',
      error: error.message
    });
  }
};

// Obter todos os tickets do usuário
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, subject, status, priority, created_at, updated_at
       FROM support_tickets WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tickets.',
      error: error.message
    });
  }
};

// Obter detalhes de um ticket
exports.getTicketDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;

    // Buscar ticket
    const ticketResult = await pool.query(
      `SELECT * FROM support_tickets
       WHERE id = $1 AND user_id = $2`,
      [ticketId, userId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado.'
      });
    }

    // Buscar respostas
    const responsesResult = await pool.query(
      `SELECT sr.*, u.first_name, u.last_name
       FROM support_responses sr
       LEFT JOIN users u ON sr.user_id = u.id
       WHERE sr.ticket_id = $1
       ORDER BY sr.created_at ASC`,
      [ticketId]
    );

    res.json({
      success: true,
      data: {
        ticket: ticketResult.rows[0],
        responses: responsesResult.rows
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do ticket.',
      error: error.message
    });
  }
};

// Adicionar resposta a um ticket
exports.addTicketResponse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória.'
      });
    }

    // Verificar se o ticket pertence ao usuário
    const ticketResult = await pool.query(
      'SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2',
      [ticketId, userId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado.'
      });
    }

    // Adicionar resposta
    const result = await pool.query(
      `INSERT INTO support_responses (ticket_id, user_id, message, is_admin)
       VALUES ($1, $2, $3, FALSE) RETURNING *`,
      [ticketId, userId, message]
    );

    // Atualizar status do ticket
    await pool.query(
      `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1`,
      [ticketId]
    );

    res.status(201).json({
      success: true,
      message: 'Resposta adicionada com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar resposta.',
      error: error.message
    });
  }
};

// Fechar ticket
exports.closeTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;

    const result = await pool.query(
      `UPDATE support_tickets SET status = 'closed', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [ticketId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Ticket fechado com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao fechar ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar ticket.',
      error: error.message
    });
  }
};
