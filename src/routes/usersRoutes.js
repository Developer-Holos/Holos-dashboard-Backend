/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del usuario
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         username:
 *           type: string
 *           description: Nombre de usuario único
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *         isAdmin:
 *           type: boolean
 *           description: Define si el usuario es administrador
 *       example:
 *         name: José Conde
 *         username: joseconde
 *         password: mysecurepassword
 *         isAdmin: false
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Error en el servidor
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios (solo para admins)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error en el servidor
 */

const express = require('express');
const { createUser, getAllUsers, getUserAssistants } = require('../controllers/usersController');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');

router.post('/', createUser);
router.get('/', isAdmin, getAllUsers);
router.get('/:userId/assistants', getUserAssistants);

module.exports = router;
