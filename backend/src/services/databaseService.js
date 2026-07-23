const { masterDb, getClientDb, removeClientDb } = require('../config/database');
const { initClientModels } = require('../models/client');
const { QueryTypes } = require('sequelize');

const createClientDatabase = async (dbName) => {
  try {
    await masterDb.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database ${dbName} created successfully`);
    return true;
  } catch (error) {
    console.error(`Error creating database ${dbName}:`, error);
    throw new Error(`Failed to create database: ${error.message}`);
  }
};

const dropClientDatabase = async (dbName) => {
  try {
    await masterDb.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    removeClientDb(dbName);
    console.log(`Database ${dbName} dropped successfully`);
    return true;
  } catch (error) {
    console.error(`Error dropping database ${dbName}:`, error);
    throw new Error(`Failed to drop database: ${error.message}`);
  }
};

const initializeClientDb = async (dbName) => {
  try {
    const sequelize = getClientDb(dbName);
    await sequelize.authenticate();
    const models = await initClientModels(sequelize);
    await sequelize.sync({ alter: true });
    console.log(`Client database ${dbName} initialized with all tables`);
    return { sequelize, models };
  } catch (error) {
    console.error(`Error initializing client database ${dbName}:`, error);
    throw new Error(`Failed to initialize client database: ${error.message}`);
  }
};

const databaseExists = async (dbName) => {
  try {
    const [results] = await masterDb.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      { replacements: [dbName], type: QueryTypes.SELECT }
    );
    return results && results.length > 0;
  } catch (error) {
    console.error(`Error checking database existence:`, error);
    return false;
  }
};

const setupNewClient = async (dbName) => {
  await createClientDatabase(dbName);
  await initializeClientDb(dbName);
  return true;
};

module.exports = {
  createClientDatabase,
  dropClientDatabase,
  initializeClientDb,
  databaseExists,
  setupNewClient
};
