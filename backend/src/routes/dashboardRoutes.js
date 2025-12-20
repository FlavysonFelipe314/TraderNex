const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const cryptoController = require('../controllers/cryptoController');
const authMiddleware = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Obter dados do dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardData'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/overview', dashboardController.getDashboardData);

/**
 * @swagger
 * /api/dashboard/performance:
 *   get:
 *     summary: Obter estatísticas de performance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Período para análise de performance
 *     responses:
 *       200:
 *         description: Estatísticas de performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: 30d
 *                     totalReturn:
 *                       type: number
 *                       example: 6.8
 *                     profit:
 *                       type: number
 *                       example: 2340.10
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/performance', dashboardController.getPerformanceStats);

/**
 * @swagger
 * /api/dashboard/mt4-accounts:
 *   get:
 *     summary: Listar contas MT4 do usuário
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas MT4
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MT4Account'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Adicionar nova conta MT4
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - broker
 *               - server
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 example: '82139402'
 *               broker:
 *                 type: string
 *                 example: 'ICMarkets (Live)'
 *               server:
 *                 type: string
 *                 example: 'ICMarkets-Live18'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'mt4_password'
 *     responses:
 *       201:
 *         description: Conta MT4 adicionada com sucesso
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
 *                   example: Conta MT4 adicionada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/MT4Account'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/mt4-accounts', dashboardController.getMT4Accounts);
router.post('/mt4-accounts', dashboardController.addMT4Account);
router.put('/mt4-accounts/:accountId/settings', dashboardController.updateMT4Settings);
router.get('/myfxbook-data', dashboardController.getMyfxbookData);

/**
 * @swagger
 * /api/dashboard/investment-plans:
 *   get:
 *     summary: Listar planos de investimento disponíveis
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planos de investimento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: 'Plano Pro'
 *                       performanceFee:
 *                         type: number
 *                         example: 18
 *                       minInvestment:
 *                         type: number
 *                         example: 1000
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/investment-plans', dashboardController.getInvestmentPlans);
router.post('/select-plan', dashboardController.selectInvestmentPlan);

/**
 * @swagger
 * /api/dashboard/investments:
 *   get:
 *     summary: Listar investimentos do usuário
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de investimentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       planId:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [active, completed, cancelled]
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/investments', dashboardController.getUserInvestments);

/**
 * @swagger
 * /api/dashboard/transactions:
 *   get:
 *     summary: Listar transações do usuário
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, profit, fee]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       date:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/transactions', dashboardController.getTransactions);

/**
 * @swagger
 * /api/dashboard/invoices:
 *   get:
 *     summary: Listar faturas do usuário
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de faturas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       invoiceNumber:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [pending, paid, overdue]
 *                       dueDate:
 *                         type: string
 *                         format: date
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/invoices', dashboardController.getInvoices);

/**
 * @swagger
 * /api/dashboard/referrals:
 *   get:
 *     summary: Obter dados de indicações do usuário
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados de indicações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     referralCode:
 *                       type: string
 *                       example: 'TN12345678'
 *                     totalReferrals:
 *                       type: integer
 *                       example: 5
 *                     totalEarnings:
 *                       type: number
 *                       example: 1250.00
 *                     referrals:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/referrals', dashboardController.getReferrals);

// Processar lucros e comissões
router.post('/process-investment-profit', dashboardController.processInvestmentProfit);
router.post('/process-mt4-profit', dashboardController.processMT4Profit);

// Faturas
router.post('/invoices/create', dashboardController.createPerformanceInvoice);
router.post('/invoices/generate-weekly', dashboardController.generateWeeklyInvoices);
router.post('/invoices/mark-paid', dashboardController.markInvoiceAsPaid);

// Registrar interesse em cripto
router.post('/crypto/register-interest', cryptoController.registerInterest);

module.exports = router;
