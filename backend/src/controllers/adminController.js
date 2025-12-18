const pool = require('../config/database');

/**
 * Obter todas as contas MT4 de todos os usuários
 * GET /api/admin/mt4-accounts
 */
exports.getAllMT4Accounts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ma.id,
        ma.account_number,
        ma.account_name,
        ma.broker,
        ma.server,
        ma.balance,
        ma.equity,
        ma.currency,
        ma.status,
        ma.connected_at,
        ma.last_sync,
        ma.myfxbook_integration_login,
        ma.created_at,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name
      FROM mt4_accounts ma
      INNER JOIN users u ON ma.user_id = u.id
      ORDER BY ma.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar contas MT4:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas MT4.',
      error: error.message
    });
  }
};

/**
 * Atualizar login de integração MyFXBook de uma conta MT4
 * PUT /api/admin/mt4-accounts/:accountId/myfxbook-login
 */
exports.updateMyfxbookIntegrationLogin = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { myfxbook_integration_login } = req.body;

    // Verificar se a conta existe
    const accountResult = await pool.query(
      'SELECT id FROM mt4_accounts WHERE id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta MT4 não encontrada.'
      });
    }

    // Atualizar o login de integração
    const updateResult = await pool.query(
      `UPDATE mt4_accounts 
       SET myfxbook_integration_login = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [myfxbook_integration_login || null, accountId]
    );

    res.json({
      success: true,
      message: 'Login de integração MyFXBook atualizado com sucesso!',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar login de integração MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar login de integração MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Obter todas as conexões MyFXBook
 * GET /api/admin/myfxbook-connections
 */
exports.getAllMyfxbookConnections = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        mc.id,
        mc.user_id,
        mc.email,
        mc.connected_at,
        mc.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM myfxbook_connections mc
      INNER JOIN users u ON mc.user_id = u.id
      ORDER BY mc.connected_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar conexões MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conexões MyFXBook.',
      error: error.message
    });
  }
};
