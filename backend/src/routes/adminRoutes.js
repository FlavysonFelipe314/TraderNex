const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminReferralsController = require('../controllers/adminReferralsController');
const plansController = require('../controllers/plansController');
const cryptoController = require('../controllers/cryptoController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Aplicar autenticação e verificação de admin em todas as rotas
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Obter todos os usuários com informações agregadas (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários com informações de MT4 e MyFXBook
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/mt4-accounts:
 *   get:
 *     summary: Obter todas as contas MT4 (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas MT4
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/mt4-accounts', adminController.getAllMT4Accounts);

/**
 * @swagger
 * /api/admin/mt4-accounts/{accountId}/myfxbook-login:
 *   put:
 *     summary: Atualizar login de integração MyFXBook (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               myfxbook_integration_login:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login atualizado com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.put('/mt4-accounts/:accountId/myfxbook-login', adminController.updateMyfxbookIntegrationLogin);

/**
 * @swagger
 * /api/admin/myfxbook-connections:
 *   get:
 *     summary: Obter todas as conexões MyFXBook (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conexões MyFXBook
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/myfxbook-connections', adminController.getAllMyfxbookConnections);

/**
 * @swagger
 * /api/admin/myfxbook-connections/{userId}/password:
 *   put:
 *     summary: Atualizar senha MyFXBook de um usuário (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.put('/myfxbook-connections/:userId/password', adminController.updateMyfxbookPassword);

/**
 * @swagger
 * /api/admin/myfxbook-connections/{userId}/email:
 *   put:
 *     summary: Atualizar email MyFXBook de um usuário (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email atualizado com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.put('/myfxbook-connections/:userId/email', adminController.updateMyfxbookEmail);

/**
 * @swagger
 * /api/admin/mt4-accounts/{accountId}/operational-controls:
 *   put:
 *     summary: Atualizar controles operacionais de uma conta MT4 (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               automation_enabled:
 *                 type: boolean
 *               risk_profile:
 *                 type: string
 *                 enum: [conservador, moderado, agressivo]
 *     responses:
 *       200:
 *         description: Controles atualizados com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.put('/mt4-accounts/:accountId/operational-controls', adminController.updateOperationalControls);

/**
 * @swagger
 * /api/admin/system/myfxbook-config:
 *   post:
 *     summary: Configurar credenciais padrão do sistema MyFXBook (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credenciais configuradas com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.post('/system/myfxbook-config', adminController.setSystemMyfxbookConfig);

/**
 * @swagger
 * /api/admin/system/myfxbook-config:
 *   get:
 *     summary: Obter credenciais padrão do sistema MyFXBook (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração obtida com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/system/myfxbook-config', adminController.getSystemMyfxbookConfig);

/**
 * @swagger
 * /api/admin/system/myfxbook-health:
 *   get:
 *     summary: Testar conexão MyFXBook do sistema (Health Check) (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da conexão
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/system/myfxbook-health', adminController.testMyfxbookHealth);

/**
 * @swagger
 * /api/admin/users/:userId/myfxbook-test:
 *   get:
 *     summary: Testar integração MyFXBook de um usuário específico (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status da integração
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/users/:userId/myfxbook-test', adminController.testUserMyfxbookIntegration);

/**
 * @swagger
 * /api/admin/myfxbook/account/:accountId/data:
 *   get:
 *     summary: Obter dados MyFXBook de uma conta específica por accountId (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados obtidos com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get('/myfxbook/account/:accountId/data', adminController.getMyfxbookAccountDataByAccountId);

// Rotas de Planos de Investimento
router.get('/plans', plansController.getAllPlans);
router.post('/plans', plansController.createPlan);
router.put('/plans/:planId', plansController.updatePlan);
router.delete('/plans/:planId', plansController.deletePlan);
router.put('/users/:userId/plan', plansController.updateUserPlan);

/**
 * @swagger
 * /api/admin/users/:userId:
 *   delete:
 *     summary: Deletar usuário (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.delete('/users/:userId', adminController.deleteUser);

// Rotas de Interessados em Cripto
router.get('/crypto/interested', cryptoController.getAllInterested);
router.put('/crypto/interested/:id/notify', cryptoController.markAsNotified);

// Rotas de Comissões e Pagamentos
router.get('/referrals/commissions', adminReferralsController.getAllReferralCommissions);
router.get('/referrals/stats', adminReferralsController.getReferralCommissionStats);
router.post('/referrals/:referralId/approve-payment', adminReferralsController.approveCommissionPayment);
router.post('/referrals/:referralId/reject-payment', adminReferralsController.rejectCommissionPayment);
router.post('/referrals/process-weekly', adminReferralsController.processWeeklyCommissions);

module.exports = router;


