const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,       // database name
  process.env.DB_USER,       // username
  process.env.DB_PASS,       // password
  {
    host: process.env.DB_HOST, // host from Render
    port: process.env.DB_PORT || 5432, // Postgres default port
    dialect: 'postgres',       // ✅ switched from mysql → postgres
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected successfully'))
  .catch(err => console.error('❌ Unable to connect to PostgreSQL:', err));

module.exports = sequelize;
