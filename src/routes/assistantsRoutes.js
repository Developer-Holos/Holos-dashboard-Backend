const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
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
 *     responses:
 *       200:
 *         description: Datos del asistente
 *       500:
 *         description: Error al obtener los datos del asistente
 */
router.get('/:assistantId', assistantController.getAssistantData);

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
 *     responses:
 *       200:
 *         description: Datos del asistente actualizados
 *       500:
 *         description: Error al actualizar los datos del asistente
 */
router.put('/:assistantId', assistantController.updateAssistantData);

/**
 * @swagger
 * /assistants:
 *   post:
 *     summary: Asociar un asistente a un usuario
 *     tags: [Assistants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Asistente creado y asociado al usuario
 *       500:
 *         description: Error al asociar el asistente al usuario
 */
router.post('/', assistantController.associateAssistantToUser);

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
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de asistentes del usuario
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al obtener los asistentes del usuario
 */
router.get('/users/:userId/assistants', assistantController.getUserAssistants);

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
 *     responses:
 *       200:
 *         description: Lista de asistentes
 *       500:
 *         description: Error al obtener los asistentes
 */
router.get('/', assistantController.getAllAssistants);

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
 *                 description: Nuevo prompt
 *     responses:
 *       200:
 *         description: Prompt del asistente actualizado
 *       400:
 *         description: El campo "instructions" es obligatorio
 *       500:
 *         description: Error al actualizar el prompt del asistente
 */
router.put('/:assistantId/prompt', assistantController.updateAssistantPrompt);

/**
 * @swagger
 * /assistants/{assistantId}/file:
 *   put:
 *     summary: Actualizar el archivo de un asistente
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
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo para subir
 *     responses:
 *       200:
 *         description: Archivo del asistente actualizado
 *       400:
 *         description: El archivo es obligatorio para actualizar el asistente
 *       500:
 *         description: Error al actualizar el archivo del asistente
 */
router.put('/:assistantId/file', assistantController.updateAssistantFile);

module.exports = router;