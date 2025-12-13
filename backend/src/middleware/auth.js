const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Pegar o token do header Authorization
    const authHeader = req.header('Authorization');
    console.log('[authMiddleware] Authorization header:', authHeader ? 'Presente' : 'Ausente');
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('[authMiddleware] Token não fornecido');
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[authMiddleware] Token válido para userId:', decoded.userId);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[authMiddleware] Erro ao verificar token:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.'
    });
  }
};

module.exports = authMiddleware;
