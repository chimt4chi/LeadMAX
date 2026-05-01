const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.resolve(process.env.DB_PATH || './src/database/leadmax.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
});

async function connectDB() {
  await sequelize.authenticate();
  console.log('✅ Database connection established.');

  // Disable FK enforcement during sync so SQLite can create tables in any order,
  // then re-enable. Use force:false so existing data is never wiped by the server.
  await sequelize.query('PRAGMA foreign_keys = OFF;');
  await sequelize.sync({ force: false });
  await sequelize.query('PRAGMA foreign_keys = ON;');
  console.log('✅ Database models synchronized.');
}

module.exports = { sequelize, connectDB };
