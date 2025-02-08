const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const authenticateJWT = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Assistants
 *   description: Gestión de asistentes
 */

/**
 * @swagger
 * /assistants/{assistantId}/file:
 *   put:
 *     summary: Actualizar los archivos de un asistente
 *     tags: [Assistants]
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
 *               filePaths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de rutas de archivos para subir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivos del asistente actualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 model:
 *                   type: string
 *                 instructions:
 *                   type: string
 *       400:
 *         description: Las rutas de los archivos son obligatorias para actualizar el asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: API key no encontrada para el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error al actualizar los archivos del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:assistantId/file', authenticateJWT, assistantController.updateAssistantFile);

module.exports = router;