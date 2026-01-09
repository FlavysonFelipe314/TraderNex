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
              profit_fee_percentage, benefits, created_at, updated_at
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
    const { name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active, profit_fee_percentage, benefits } = req.body;

    if (!name || !min_investment) {
      return res.status(400).json({
        success: false,
        message: 'Nome e investimento mínimo são obrigatórios.'
      });
    }

    // Converter benefits para JSON se for array
    let benefitsJson = '[]';
    if (benefits && Array.isArray(benefits)) {
      benefitsJson = JSON.stringify(benefits);
    } else if (typeof benefits === 'string') {
      try {
        JSON.parse(benefits); // Validar JSON
        benefitsJson = benefits;
      } catch (e) {
        benefitsJson = '[]';
      }
    }

    const result = await pool.query(
      `INSERT INTO investment_plans (name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active, profit_fee_percentage, benefits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       RETURNING *`,
      [name, description || null, min_investment, max_investment || null, expected_return || null, duration_days || null, risk_level || 'Medium', is_active !== undefined ? is_active : true, profit_fee_percentage || 0, benefitsJson]
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
    const { name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active, profit_fee_percentage, benefits } = req.body;

    // Converter benefits para JSON se for array
    let benefitsJson = null;
    if (benefits !== undefined) {
      if (Array.isArray(benefits)) {
        benefitsJson = JSON.stringify(benefits);
      } else if (typeof benefits === 'string') {
        try {
          JSON.parse(benefits); // Validar JSON
          benefitsJson = benefits;
        } catch (e) {
          benefitsJson = '[]';
        }
      } else {
        benefitsJson = '[]';
      }
    }

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
           profit_fee_percentage = COALESCE($9, profit_fee_percentage),
           benefits = COALESCE($10::jsonb, benefits),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [name, description, min_investment, max_investment, expected_return, duration_days, risk_level, is_active, profit_fee_percentage, benefitsJson, planId]
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
 * Obter usuários com planos pendentes de aprovação (Admin)
 * GET /api/admin/plans/pending-approvals
 */
exports.getPendingPlanApprovals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         cp.user_id,
         cp.selected_plan_id,
         cp.plan_status,
         cp.plan_reviewed_at,
         cp.plan_review_notes,
         u.email,
         u.first_name,
         u.last_name,
         u.created_at as user_created_at,
         ip.name as plan_name,
         ip.min_investment,
         ip.max_investment,
         ip.profit_fee_percentage
       FROM client_profiles cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE cp.plan_status = 'pending'
         AND cp.selected_plan_id IS NOT NULL
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar planos pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar planos pendentes de aprovação.',
      error: error.message
    });
  }
};

/**
 * Aprovar plano de um usuário (Admin)
 * POST /api/admin/plans/:userId/approve
 */
exports.approveUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const { notes } = req.body || {};

    // Verificar se o usuário existe e tem plano pendente
    const profileResult = await pool.query(
      `SELECT cp.user_id, cp.selected_plan_id, cp.plan_status,
              u.email, u.first_name, u.last_name,
              ip.name as plan_name
       FROM client_profiles cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE cp.user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const profile = profileResult.rows[0];

    if (!profile.selected_plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui plano selecionado.'
      });
    }

    if (profile.plan_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Plano já foi ${profile.plan_status === 'approved' ? 'aprovado' : 'rejeitado'}.`
      });
    }

    // Aprovar plano
    await pool.query(
      `UPDATE client_profiles
       SET plan_status = 'approved',
           plan_reviewed_at = NOW(),
           plan_reviewed_by = $1,
           plan_review_notes = $2,
           updated_at = NOW()
       WHERE user_id = $3`,
      [adminId, notes || null, userId]
    );

    // Enviar email de aprovação (será implementado)
    const { sendPlanApprovalEmail } = require('../services/emailService');
    try {
      await sendPlanApprovalEmail(
        profile.email,
        profile.first_name || 'Cliente',
        profile.plan_name
      );
    } catch (emailError) {
      console.error('Erro ao enviar email de aprovação:', emailError);
      // Não falhar a requisição se o email falhar
    }

    res.json({
      success: true,
      message: 'Plano aprovado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao aprovar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar plano do usuário.',
      error: error.message
    });
  }
};

/**
 * Rejeitar plano de um usuário (Admin)
 * POST /api/admin/plans/:userId/reject
 */
exports.rejectUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const { notes } = req.body || {};

    // Verificar se o usuário existe e tem plano pendente
    const profileResult = await pool.query(
      `SELECT cp.user_id, cp.selected_plan_id, cp.plan_status,
              u.email, u.first_name, u.last_name,
              ip.name as plan_name
       FROM client_profiles cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN investment_plans ip ON cp.selected_plan_id = ip.id
       WHERE cp.user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const profile = profileResult.rows[0];

    if (!profile.selected_plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui plano selecionado.'
      });
    }

    if (profile.plan_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Plano já foi ${profile.plan_status === 'approved' ? 'aprovado' : 'rejeitado'}.`
      });
    }

    // Rejeitar plano (remover plano selecionado e marcar como rejeitado)
    await pool.query(
      `UPDATE client_profiles
       SET plan_status = 'rejected',
           plan_reviewed_at = NOW(),
           plan_reviewed_by = $1,
           plan_review_notes = $2,
           selected_plan_id = NULL,
           updated_at = NOW()
       WHERE user_id = $3`,
      [adminId, notes || null, userId]
    );

    // Enviar email de rejeição (será implementado)
    const { sendPlanRejectionEmail } = require('../services/emailService');
    try {
      await sendPlanRejectionEmail(
        profile.email,
        profile.first_name || 'Cliente',
        profile.plan_name,
        notes || 'Não aprovado pelos critérios da empresa.'
      );
    } catch (emailError) {
      console.error('Erro ao enviar email de rejeição:', emailError);
      // Não falhar a requisição se o email falhar
    }

    res.json({
      success: true,
      message: 'Plano rejeitado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao rejeitar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar plano do usuário.',
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

