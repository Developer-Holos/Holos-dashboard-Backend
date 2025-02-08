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
 * /assistants/{assistantId}:
 *   get:
 *     summary: Obtener información de un asistente
 *     tags: [Assistants]
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
 *         description: Datos del asistente
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
 *         description: Error al obtener los datos del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/:assistantId', authenticateJWT, assistantController.getAssistantData);

/**
 * @swagger
 * /assistants/{assistantId}:
 *   put:
 *     summary: Actualizar los datos de un asistente
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
 *               newData:
 *                 type: object
 *                 description: Nuevos datos del asistente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del asistente actualizados
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
 *         description: Error al actualizar los datos del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:assistantId', authenticateJWT, assistantController.updateAssistantData);

/**
 * @swagger
 * /users/{userId}/assistants:
 *   get:
 *     summary: Obtener todos los asistentes de un usuario
 *     tags: [Assistants]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asistentes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   model:
 *                     type: string
 *                   instructions:
 *                     type: string
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Error al obtener los asistentes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/users/:userId/assistants', authenticateJWT, assistantController.getUserAssistants);

/**
 * @swagger
 * /assistants:
 *   get:
 *     summary: Obtener todos los asistentes
 *     tags: [Assistants]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Orden de los resultados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asistentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   model:
 *                     type: string
 *                   instructions:
 *                     type: string
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
 *         description: Error al obtener los asistentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/', authenticateJWT, assistantController.getAllAssistants);

/**
 * @swagger
 * /assistants/{assistantId}/prompt:
 *   put:
 *     summary: Actualizar el prompt de un asistente
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
 *               instructions:
 *                 type: string
 *                 description: Instrucciones del nuevo prompt
 *               promptName:
 *                 type: string
 *                 description: Nombre del nuevo prompt
 *             required:
 *               - instructions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prompt actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assistant:
 *                   type: object
 *                   description: Datos del asistente actualizados
 *                 prompt:
 *                   type: object
 *                   description: Datos del nuevo prompt
 *       400:
 *         description: Error en la solicitud
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
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:assistantId/prompt', authenticateJWT, assistantController.updateAssistantPrompt);

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