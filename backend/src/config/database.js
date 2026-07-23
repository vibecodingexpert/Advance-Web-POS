const { Sequelize } = require('sequelize');
require('dotenv').config();

const masterDb = new Sequelize(
  process.env.MASTER_DB_NAME,
  process.env.MASTER_DB_USER,
  process.env.MASTER_DB_PASSWORD,
  {
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? false : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    }
  }
);

const clientConnections = {};

const getClientDb = (dbName) => {
  if (clientConnections[dbName]) {
    return clientConnections[dbName];
  }
  const sequelize = new Sequelize(
    dbName,
    process.env.MASTER_DB_USER,
    process.env.MASTER_DB_PASSWORD,
    {
      host: process.env.MASTER_DB_HOST,
      port: process.env.MASTER_DB_PORT,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    }
  );
  clientConnections[dbName] = sequelize;
  return sequelize;
};

const removeClientDb = (dbName) => {
  if (clientConnections[dbName]) {
    delete clientConnections[dbName];
  }
};

module.exports = { masterDb, getClientDb, removeClientDb };
