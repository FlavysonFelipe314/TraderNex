const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/database');

// Gerar código de referência único
const generateReferralCode = () => {
  return 'TN' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Registrar usuário
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, country } = req.body;

    // Verificar se o usuário já existe
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado.'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, country)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name`,
      [email, hashedPassword, firstName, lastName, phone, country]
    );

    const user = result.rows[0];

    // Criar perfil do cliente
    const referralCode = generateReferralCode();
    await pool.query(
      `INSERT INTO client_profiles (user_id, referral_code)
       VALUES ($1, $2)`,
      [user.id, referralCode]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuário.',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    const user = result.rows[0];

    // Verificar se o usuário está ativo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login.',
      error: error.message
    });
  }
};

// Solicitar reset de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o usuário existe
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Por segurança, retornar sucesso mesmo se o email não existir
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
      });
    }

    const user = result.rows[0];

    // Gerar token de reset
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Salvar token no banco
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    // TODO: Enviar email com o token
    // Por enquanto, retornar o token (em produção, enviar por email)

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha.',
      // Em produção, remover esta linha:
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação.',
      error: error.message
    });
  }
};

// Reset de senha
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, newPassword } = req.body;
    const finalPassword = password || newPassword; // Aceitar ambos os formatos

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }

    // Verificar se o token existe no banco e não foi usado
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido, já utilizado ou expirado.'
      });
    }

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória.'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    // Marcar token como usado
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha.',
      error: error.message
    });
  }
};

// Verificar email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }

    // Atualizar email_verified
    await pool.query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [decoded.userId]
    );

    res.json({
      success: true,
      message: 'Email verificado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar email.',
      error: error.message
    });
  }
};

// Obter perfil do usuário
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.country,
              u.email_verified, u.created_at,
              cp.account_type, cp.balance, cp.total_invested, cp.total_profit,
              cp.profit_percentage, cp.referral_code,
              cp.street, cp.number, cp.neighborhood, cp.city, cp.state, cp.zip_code, cp.complement
       FROM users u
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil.',
      error: error.message
    });
  }
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      firstName, 
      lastName, 
      phone, 
      country,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      complement
    } = req.body;

    // Atualizar dados do usuário
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      updateValues.push(firstName);
      paramIndex++;
    }
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      updateValues.push(lastName);
      paramIndex++;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateValues.push(phone);
      paramIndex++;
    }
    if (country !== undefined) {
      updateFields.push(`country = $${paramIndex}`);
      updateValues.push(country);
      paramIndex++;
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);
      
      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );
    }

    // Atualizar endereço se fornecido
    if (street || number || neighborhood || city || state || zipCode || complement) {
      // Verificar se já existe endereço
      const addressCheck = await pool.query(
        'SELECT id FROM client_profiles WHERE user_id = $1',
        [userId]
      );

      if (addressCheck.rows.length > 0) {
        // Atualizar endereço existente
        const addressFields = [];
        const addressValues = [];
        let addrParamIndex = 1;

        if (street !== undefined) {
          addressFields.push(`street = $${addrParamIndex}`);
          addressValues.push(street);
          addrParamIndex++;
        }
        if (number !== undefined) {
          addressFields.push(`number = $${addrParamIndex}`);
          addressValues.push(number);
          addrParamIndex++;
        }
        if (neighborhood !== undefined) {
          addressFields.push(`neighborhood = $${addrParamIndex}`);
          addressValues.push(neighborhood);
          addrParamIndex++;
        }
        if (city !== undefined) {
          addressFields.push(`city = $${addrParamIndex}`);
          addressValues.push(city);
          addrParamIndex++;
        }
        if (state !== undefined) {
          addressFields.push(`state = $${addrParamIndex}`);
          addressValues.push(state);
          addrParamIndex++;
        }
        if (zipCode !== undefined) {
          addressFields.push(`zip_code = $${addrParamIndex}`);
          addressValues.push(zipCode);
          addrParamIndex++;
        }
        if (complement !== undefined) {
          addressFields.push(`complement = $${addrParamIndex}`);
          addressValues.push(complement);
          addrParamIndex++;
        }

        if (addressFields.length > 0) {
          addressFields.push(`updated_at = NOW()`);
          addressValues.push(userId);
          
          await pool.query(
            `UPDATE client_profiles SET ${addressFields.join(', ')} WHERE user_id = $${addrParamIndex}`,
            addressValues
          );
        }
      } else {
        // Criar novo registro de endereço
        await pool.query(
          `INSERT INTO client_profiles (user_id, street, number, neighborhood, city, state, zip_code, complement)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, street || null, number || null, neighborhood || null, city || null, state || null, zipCode || null, complement || null]
        );
      }
    }

    // Buscar perfil atualizado
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.country,
              u.email_verified, u.created_at,
              cp.account_type, cp.balance, cp.total_invested, cp.total_profit,
              cp.profit_percentage, cp.referral_code,
              cp.street, cp.number, cp.neighborhood, cp.city, cp.state, cp.zip_code, cp.complement
       FROM users u
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil.',
      error: error.message
    });
  }
};

// Atualizar senha
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter no mínimo 6 caracteres.'
      });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const user = result.rows[0];

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta.'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar senha.',
      error: error.message
    });
  }
};
