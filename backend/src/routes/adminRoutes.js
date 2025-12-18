const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Aplicar autenticação e verificação de admin em todas as rotas
router.use(authMiddleware);
router.use(adminAuthMiddleware);

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

module.exports = router;

