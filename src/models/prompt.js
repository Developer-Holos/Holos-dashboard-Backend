const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prompt = sequelize.define('Prompt', {
    content: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    assistantId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});

module.exports = Prompt;