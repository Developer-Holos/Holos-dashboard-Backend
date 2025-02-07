const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authenticateJWT = require('../middleware/auth');

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
 *               password:
 *                 type: string
 *               apiKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
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