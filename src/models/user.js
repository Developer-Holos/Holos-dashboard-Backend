const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // false = usuario normal, true = administrador
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true, // Puede ser nulo si el usuario no tiene un apiKey
  },
}, {
  timestamps: true,
});

module.exports = User;