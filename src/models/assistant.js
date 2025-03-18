const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Assistant = sequelize.define("Assistant", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    vectorStoreId: { // Nuevo campo
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = Assistant;