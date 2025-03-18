const { User, Assistant } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Cambia esto según tu proveedor de correo
  auth: {
    user: 'recoverholos@gmail.com', // Tu correo electrónico
    pass: 'koue rajk kfqi vehs', // Tu contraseña o app password
  },
});

// Generar un código alfanumérico de 6 caracteres
const generateResetCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 caracteres alfanuméricos
};

// Crear usuario
exports.createUser = async (req, res) => {
  const { name, username, password, isAdmin, apiKey } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, password: hashedPassword, isAdmin, apiKey });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Registrar usuario
exports.register = async (req, res) => {
  const { name, username, email, password, apiKey } = req.body;

  try {
    // Validar si el email ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashedPassword, apiKey });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token, userId: user.id, isAdmin: user.isAdmin, apiKey: user.apiKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Solicitar recuperación de contraseña
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generar el código de recuperación
    const resetCode = generateResetCode();

    // Guardar el código y la expiración en el usuario
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
    await user.save();

    // Enviar correo electrónico con el código
    const mailOptions = {
      from: '"Holos Support" <no-reply@holos.ec>', // Cambiado a no-reply
      to: email,
      subject: 'Solicitud de recuperación de contraseña',
      text: `Hola, has solicitado recuperar tu contraseña. Usa el siguiente código para restablecerla: ${resetCode}. Este código es válido por 10 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para restablecerla:</p>
          <p style="font-size: 1.5em; font-weight: bold; color: #007BFF;">${resetCode}</p>
          <p>Este código es válido por <strong>10 minutos</strong>.</p>
          <p>Si no solicitaste este código, por favor ignora este mensaje. Este correo es enviado automáticamente, no respondas a este mensaje.</p>
          <p>Atentamente,<br>El equipo de Holos</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset code sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verificar el código y la expiración
    if (user.resetCode !== resetCode || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Actualizar la contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null; // Limpiar el código
    user.resetCodeExpires = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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