const express = require('express');
const { createPrompt, getPromptsByAssistant, deletePrompt, usePreviousVersion, getPromptById, updatePrompt } = require('../controllers/promptsController');
const authenticateJWT = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Prompts
 *   description: Gestión de prompts
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /prompts/assistant/{assistantId}:
 *   post:
 *     summary: Crear un nuevo prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del asistente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Contenido del prompt
 *               name:
 *                 type: string
 *                 description: Nombre de la versión del prompt
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Prompt creado exitosamente
 *       500:
 *         description: Error al crear el prompt
 */
router.post('/assistant/:assistantId', authenticateJWT, createPrompt); // Crear un prompt

/**
 * @swagger
 * /prompts/assistant/{assistantId}:
 *   get:
 *     summary: Obtener prompts por ID de asistente
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del asistente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de prompts
 *       500:
 *         description: Error al obtener los prompts
 */
router.get('/assistant/:assistantId', authenticateJWT, getPromptsByAssistant); // Obtener prompts por ID de asistente

/**
 * @swagger
 * /prompts/{id}:
 *   get:
 *     summary: Obtener un prompt por ID
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del prompt
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del prompt
 *       404:
 *         description: Prompt no encontrado
 *       500:
 *         description: Error al obtener el prompt
 */
router.get('/:id', authenticateJWT, getPromptById); // Obtener un prompt por ID

/**
 * @swagger
 * /prompts/{id}:
 *   delete:
 *     summary: Eliminar un prompt por ID
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del prompt
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Prompt eliminado exitosamente
 *       404:
 *         description: Prompt no encontrado
 *       500:
 *         description: Error al eliminar el prompt
 */
router.delete('/:id', authenticateJWT, deletePrompt); // Eliminar un prompt por ID

/**
 * @swagger
 * /prompts/use/{id}:
 *   put:
 *     summary: Usar una versión anterior de un prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del prompt
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prompt activado exitosamente
 *       404:
 *         description: Prompt no encontrado
 *       500:
 *         description: Error al activar el prompt
 */
router.put('/use/:id', authenticateJWT, usePreviousVersion); // Usar una versión anterior de un prompt

module.exports = router;