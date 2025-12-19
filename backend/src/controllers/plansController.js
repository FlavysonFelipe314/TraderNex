const pool = require('../config/database');

/**
 * Obter todos os planos de investimento (Admin)
 * GET /api/admin/plans
 */
exports.getAllPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, min_investment, max_investment,
              expected_return, duration_days, risk_level, is_active,
              created_at, updated_at
       FROM investment_plans
       ORDER BY min_investment ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar planos de investimento.',
      error: error.message
    });
  }
};

/**
 * Criar novo plano de investimento (Admin)
 * POST /api/admin/plans
 */
exports.createPlan = async (req, res) => {
  try {
    const { name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active } = req.body;

    if (!name || !min_investment || !expected_return) {
      return res.status(400).json({
        success: false,
        message: 'Nome, investimento mínimo e retorno esperado são obrigatórios.'
      });
    }

    const result = await pool.query(
      `INSERT INTO investment_plans (name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description || null, min_investment, max_investment || null, expected_return, duration_days || null, risk_level || 'Medium', is_active !== undefined ? is_active : true]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Plano criado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Já existe um plano com este nome.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao criar plano de investimento.',
      error: error.message
    });
  }
};

/**
 * Atualizar plano de investimento (Admin)
 * PUT /api/admin/plans/:planId
 */
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active } = req.body;

    const result = await pool.query(
      `UPDATE investment_plans
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           min_investment = COALESCE($3, min_investment),
           max_investment = $4,
           expected_return = COALESCE($5, expected_return),
           duration_days = $6,
           risk_level = COALESCE($7, risk_level),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active, planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Plano atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar plano de investimento.',
      error: error.message
    });
  }
};

/**
 * Deletar plano de investimento (Admin)
 * DELETE /api/admin/plans/:planId
 */
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Verificar se há usuários usando este plano
    const usersWithPlan = await pool.query(
      'SELECT COUNT(*) as count FROM client_profiles WHERE selected_plan_id = $1',
      [planId]
    );

    if (parseInt(usersWithPlan.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar este plano. Existem usuários associados a ele.'
      });
    }

    const result = await pool.query(
      'DELETE FROM investment_plans WHERE id = $1 RETURNING *',
      [planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Plano deletado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar plano de investimento.',
      error: error.message
    });
  }
};

/**
 * Atualizar plano selecionado de um usuário (Admin)
 * PUT /api/admin/users/:userId/plan
 */
exports.updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan_id } = req.body;

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

    // Verificar se o plano existe (se fornecido)
    if (plan_id) {
      const planCheck = await pool.query(
        'SELECT id FROM investment_plans WHERE id = $1',
        [plan_id]
      );

      if (planCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plano não encontrado.'
        });
      }
    }

    // Verificar se o perfil existe, se não, criar
    const profileCheck = await pool.query(
      'SELECT id FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileCheck.rows.length === 0) {
      // Criar perfil se não existir
      await pool.query(
        `INSERT INTO client_profiles (user_id, selected_plan_id)
         VALUES ($1, $2)`,
        [userId, plan_id || null]
      );
    } else {
      // Atualizar perfil existente
      await pool.query(
        `UPDATE client_profiles
         SET selected_plan_id = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [plan_id || null, userId]
      );
    }

    // Buscar dados atualizados
    const updatedResult = await pool.query(
      `SELECT cp.selected_plan_id, ip.name as plan_name
       FROM client_profiles cp
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE cp.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        selected_plan_id: updatedResult.rows[0]?.selected_plan_id || null,
        plan_name: updatedResult.rows[0]?.plan_name || null
      },
      message: 'Plano do usuário atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar plano do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar plano do usuário.',
      error: error.message
    });
  }
};

