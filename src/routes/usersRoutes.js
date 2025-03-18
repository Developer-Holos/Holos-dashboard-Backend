const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authenticateJWT = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Assistant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del asistente
 *         name:
 *           type: string
 *           description: Nombre del asistente
 *         description:
 *           type: string
 *           description: Descripción del asistente
 *         userId:
 *           type: integer
 *           description: ID del usuario
 *         version:
 *           type: integer
 *           description: Versión del asistente
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del usuario
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         username:
 *           type: string
 *           description: Nombre de usuario
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *         isAdmin:
 *           type: boolean
 *           description: Indica si el usuario es administrador
 *         apiKey:
 *           type: string
 *           description: API key del usuario
 *         resetCode:
 *           type: string
 *           description: Código de recuperación de contraseña
 *         resetCodeExpires:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración del código de recuperación
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *               apiKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       500:
 *         description: Error al crear el usuario
 */
router.post('/', usersController.createUser);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               apiKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Email ya está en uso
 *       500:
 *         description: Error al registrar el usuario
 */
router.post('/register', usersController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al iniciar sesión
 */
router.post('/login', usersController.login);

/**
 * @swagger
 * /users/request-password-reset:
 *   post:
 *     summary: Solicitar un código de recuperación de contraseña
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *     responses:
 *       200:
 *         description: Código de recuperación enviado al correo electrónico
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al procesar la solicitud
 */
router.post('/request-password-reset', usersController.requestPasswordReset);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Restablecer la contraseña del usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               resetCode:
 *                 type: string
 *                 description: Código de recuperación enviado al correo
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña del usuario
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Código inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al procesar la solicitud
 */
router.post('/reset-password', usersController.resetPassword);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Error al obtener los usuarios
 */
router.get('/', authenticateJWT, usersController.getAllUsers);

/**
 * @swagger
 * /users/{userId}/assistants:
 *   get:
 *     summary: Obtener todos los asistentes de un usuario
 *     tags: [Users]
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
 *                 $ref: '#/components/schemas/Assistant'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al obtener los asistentes del usuario
 */
router.get('/:userId/assistants', authenticateJWT, usersController.getUserAssistants);

module.exports = router;