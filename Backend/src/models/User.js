const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false },
  apiKey: { type: DataTypes.STRING(10), allowNull: true },
  password: { type: DataTypes.STRING, allowNull: true },
  cookieFile: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'users',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
