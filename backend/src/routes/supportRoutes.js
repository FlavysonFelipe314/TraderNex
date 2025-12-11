const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Criar novo ticket de suporte
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - category
 *             properties:
 *               subject:
 *                 type: string
 *                 example: 'Problema com conexão MT4'
 *               message:
 *                 type: string
 *                 example: 'Não consigo conectar minha conta MT4...'
 *               category:
 *                 type: string
 *                 enum: [technical, billing, account, other]
 *                 example: technical
 *     responses:
 *       201:
 *         description: Ticket criado com sucesso
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
 *                   example: Ticket criado com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     ticketNumber:
 *                       type: string
 *                       example: 'TN-2024-001'
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
 *   get:
 *     summary: Listar tickets do usuário
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, pending]
 *         description: Filtrar por status do ticket
 *     responses:
 *       200:
 *         description: Lista de tickets
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
 *                       ticketNumber:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [open, closed, pending]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getUserTickets);

/**
 * @swagger
 * /api/support/tickets/{ticketId}:
 *   get:
 *     summary: Obter detalhes de um ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ticket
 *     responses:
 *       200:
 *         description: Detalhes do ticket
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
 *                     id:
 *                       type: integer
 *                     ticketNumber:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     message:
 *                       type: string
 *                     status:
 *                       type: string
 *                     responses:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Ticket não encontrado
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
router.get('/tickets/:ticketId', supportController.getTicketDetails);

/**
 * @swagger
 * /api/support/tickets/{ticketId}/responses:
 *   post:
 *     summary: Adicionar resposta a um ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: 'Obrigado pela informação adicional...'
 *     responses:
 *       201:
 *         description: Resposta adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ticket não encontrado
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
router.post('/tickets/:ticketId/responses', supportController.addTicketResponse);

/**
 * @swagger
 * /api/support/tickets/{ticketId}/close:
 *   patch:
 *     summary: Fechar um ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ticket
 *     responses:
 *       200:
 *         description: Ticket fechado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Ticket não encontrado
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
router.patch('/tickets/:ticketId/close', supportController.closeTicket);

module.exports = router;
