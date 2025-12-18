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
        ma.automation_enabled,
        ma.risk_profile,
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

/**
 * Atualizar senha MyFXBook de um usuário (Admin)
 * PUT /api/admin/myfxbook-connections/:userId/password
 */
exports.updateMyfxbookPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória.'
      });
    }

    // Verificar se o usuário existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Criptografar senha
    const { encrypt } = require('../utils/encryption');
    const encryptedPassword = encrypt(password);

    // Verificar se já existe conexão MyFXBook
    const connectionCheck = await pool.query(
      'SELECT id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionCheck.rows.length > 0) {
      // Atualizar senha na conexão existente
      await pool.query(
        `UPDATE myfxbook_connections 
         SET encrypted_password = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [encryptedPassword, userId]
      );
    } else {
      // Criar conexão com apenas a senha (sem email ainda)
      await pool.query(
        `INSERT INTO myfxbook_connections (user_id, email, encrypted_password, connected_at, updated_at)
         VALUES ($1, '', $2, NOW(), NOW())`,
        [userId, encryptedPassword]
      );
    }

    res.json({
      success: true,
      message: 'Senha MyFXBook atualizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar senha MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Atualizar email MyFXBook de um usuário (Admin)
 * PUT /api/admin/myfxbook-connections/:userId/email
 */
exports.updateMyfxbookEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório.'
      });
    }

    // Verificar se o usuário existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Verificar se já existe conexão MyFXBook
    const connectionCheck = await pool.query(
      'SELECT id FROM myfxbook_connections WHERE user_id = $1',
      [userId]
    );

    if (connectionCheck.rows.length > 0) {
      // Atualizar email na conexão existente
      await pool.query(
        `UPDATE myfxbook_connections 
         SET email = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [email, userId]
      );
    } else {
      // Criar conexão com apenas o email
      await pool.query(
        `INSERT INTO myfxbook_connections (user_id, email, connected_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, email]
      );
    }

    res.json({
      success: true,
      message: 'Email MyFXBook atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar email MyFXBook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar email MyFXBook.',
      error: error.message
    });
  }
};

/**
 * Atualizar controles operacionais de uma conta MT4 (Admin)
 * PUT /api/admin/mt4-accounts/:accountId/operational-controls
 */
exports.updateOperationalControls = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { automation_enabled, risk_profile } = req.body;

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

    // Validar risk_profile
    if (risk_profile && !['conservador', 'moderado', 'agressivo'].includes(risk_profile)) {
      return res.status(400).json({
        success: false,
        message: 'Perfil de risco inválido. Deve ser: conservador, moderado ou agressivo.'
      });
    }

    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (automation_enabled !== undefined) {
      updateFields.push(`automation_enabled = $${paramIndex}`);
      updateValues.push(automation_enabled);
      paramIndex++;
    }

    if (risk_profile !== undefined) {
      updateFields.push(`risk_profile = $${paramIndex}`);
      updateValues.push(risk_profile);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar.'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(accountId);

    // Atualizar
    const updateResult = await pool.query(
      `UPDATE mt4_accounts 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Controles operacionais atualizados com sucesso!',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar controles operacionais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar controles operacionais.',
      error: error.message
    });
  }
};


