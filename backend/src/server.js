const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const supportRoutes = require('./routes/supportRoutes');
const myfxbookRoutes = require('./routes/myfxbookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'http://localhost:5174',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000', // Frontend em modo dev
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://18.206.244.149:5005' // IP de produção (se necessário)
    ].filter(Boolean)
  : [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000', // Frontend em modo dev
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: Postman, mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir qualquer origem localhost ou 127.0.0.1 (tanto em dev quanto em produção local)
    // Isso facilita o desenvolvimento local mesmo com NODE_ENV=production
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Verificar se a origem está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log para debug
      console.warn(`CORS bloqueado para origem: ${origin}`);
      console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica o status da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'TraderNex API está funcionando!'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2024-01-01T00:00:00.000Z'
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TraderNex API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TraderNex API Documentation'
}));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/myfxbook', myfxbookRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('   🚀 TraderNex API Server');
  console.log('═══════════════════════════════════════════');
  console.log(`   📡 Servidor rodando na porta: ${PORT}`);
  console.log(`   🌍 URL: http://localhost:${PORT}`);
  console.log(`   🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`   📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`   📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

module.exports = app;