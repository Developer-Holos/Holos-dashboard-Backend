const { User, Assistant } = require('../models');
const bcrypt = require('bcrypt');

// Crear usuario
exports.createUser = async (req, res) => {
  const { name, username, password, isAdmin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, password: hashedPassword, isAdmin });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los usuarios (solo admins)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener asistentes de un usuario
exports.getUserAssistants = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId, {
      include: [Assistant],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.Assistants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
