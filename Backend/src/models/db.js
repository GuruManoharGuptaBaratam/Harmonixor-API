const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSsl = process.env.DB_SSL !== "false";

const baseConfig = {
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: 0,
    idle: 10000,
    acquire: 30000
  }
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, baseConfig)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        ...baseConfig,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
      }
    );

// sequelize.authenticate()
//   .then(() => console.log('✅ PostgreSQL connected successfully'))
//   .catch(err => console.error('❌ Unable to connect to PostgreSQL:', err));

module.exports = sequelize;
