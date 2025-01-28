const sequelize = require('../config/database');
const Assistant = require('./assistant');
const Prompt = require('./prompt');
const User = require('./user');

// Define relaciones
User.hasMany(Assistant, { foreignKey: 'userId', onDelete: 'CASCADE' });
Assistant.belongsTo(User, { foreignKey: 'userId' });

Assistant.hasMany(Prompt, { foreignKey: 'assistantId', onDelete: 'CASCADE' });
Prompt.belongsTo(Assistant, { foreignKey: 'assistantId' });

// Sincroniza modelos con la base de datos
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = {
  User,
  Assistant,
  Prompt,
  syncDatabase,
};