const pool = require('../config/database');

/**
 * Middleware para verificar se o usuário é admin
 * Deve ser usado após o authMiddleware
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Buscar usuário no banco
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const user = result.rows[0];

    if (!user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissões de administrador.'
    });
  }
};

module.exports = adminAuthMiddleware;
