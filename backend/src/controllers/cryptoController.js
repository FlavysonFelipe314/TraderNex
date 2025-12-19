const pool = require('../config/database');

/**
 * Registrar interesse em cripto
 * POST /api/crypto/register-interest
 */
exports.registerInterest = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { email } = req.body;

    // Se não tiver userId, email é obrigatório
    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório para usuários não autenticados.'
      });
    }

    // Se tiver userId, buscar email do usuário
    let userEmail = email;
    let firstName = null;
    let lastName = null;

    if (userId) {
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      const user = userResult.rows[0];
      userEmail = user.email;
      firstName = user.first_name;
      lastName = user.last_name;
    }

    // Verificar se já está registrado
    const existingCheck = await pool.query(
      userId 
        ? 'SELECT id FROM crypto_interested WHERE user_id = $1'
        : 'SELECT id FROM crypto_interested WHERE email = $1',
      userId ? [userId] : [userEmail]
    );

    if (existingCheck.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Você já está registrado para receber notificações sobre o lançamento!',
        alreadyRegistered: true
      });
    }

    // Registrar interesse
    const result = await pool.query(
      `INSERT INTO crypto_interested (user_id, email, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, userEmail, firstName, lastName]
    );

    res.json({
      success: true,
      message: 'Registrado com sucesso! Você será avisado quando lançarmos o módulo de Cripto Futures.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar interesse em cripto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar interesse.',
      error: error.message
    });
  }
};

/**
 * Listar todos os interessados (apenas admin)
 * GET /api/admin/crypto/interested
 */
exports.getAllInterested = async (req, res) => {
  try {
    const { page = 1, limit = 50, notified = null } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ci.id,
        ci.user_id,
        ci.email,
        ci.first_name,
        ci.last_name,
        ci.notified,
        ci.notified_at,
        ci.created_at,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM crypto_interested ci
      LEFT JOIN users u ON ci.user_id = u.id
    `;

    const queryParams = [];
    const conditions = [];

    if (notified !== null) {
      conditions.push(`ci.notified = $${queryParams.length + 1}`);
      queryParams.push(notified === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ci.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), offset);

    // Buscar total
    let countQuery = 'SELECT COUNT(*) as total FROM crypto_interested ci';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, notified !== null ? [notified === 'true'] : [])
    ]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name || row.user_first_name,
        lastName: row.last_name || row.user_last_name,
        notified: row.notified,
        notifiedAt: row.notified_at,
        createdAt: row.created_at,
        isRegisteredUser: !!row.user_id
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar interessados em cripto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar interessados.',
      error: error.message
    });
  }
};

/**
 * Marcar como notificado (apenas admin)
 * PUT /api/admin/crypto/interested/:id/notify
 */
exports.markAsNotified = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE crypto_interested 
       SET notified = TRUE, notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Interessado não encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Marcado como notificado com sucesso.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao marcar como notificado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar como notificado.',
      error: error.message
    });
  }
};
