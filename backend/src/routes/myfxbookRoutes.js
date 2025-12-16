const express = require('express');
const router = express.Router();
const myfxbookController = require('../controllers/myfxbookController');
const authMiddleware = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/myfxbook/connect:
 *   post:
 *     summary: Conectar conta Myfxbook
 *     tags: [Myfxbook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'usuario@example.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'senha123'
 *     responses:
 *       200:
 *         description: Conta conectada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/connect', myfxbookController.connectMyfxbook);

/**
 * @swagger
 * /api/myfxbook/disconnect:
 *   post:
 *     summary: Desconectar conta Myfxbook
 *     tags: [Myfxbook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta desconectada com sucesso
 *       404:
 *         description: Nenhuma conexão encontrada
 */
router.post('/disconnect', myfxbookController.disconnectMyfxbook);

/**
 * @swagger
 * /api/myfxbook/status:
 *   get:
 *     summary: Obter status da conexão Myfxbook
 *     tags: [Myfxbook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da conexão
 */
router.get('/status', myfxbookController.getMyfxbookStatus);

/**
 * @swagger
 * /api/myfxbook/accounts:
 *   get:
 *     summary: Obter contas do Myfxbook
 *     tags: [Myfxbook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas
 *       404:
 *         description: Nenhuma conexão encontrada
 */
router.get('/accounts', myfxbookController.getMyfxbookAccounts);

/**
 * @swagger
 * /api/myfxbook/accounts/{accountId}/data:
 *   get:
 *     summary: Obter dados de uma conta específica
 *     tags: [Myfxbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta Myfxbook
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (yyyy-mm-dd)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (yyyy-mm-dd)
 *     responses:
 *       200:
 *         description: Dados da conta
 */
router.get('/accounts/:accountId/data', myfxbookController.getAccountData);

module.exports = router;

