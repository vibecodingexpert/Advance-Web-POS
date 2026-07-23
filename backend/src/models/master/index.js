const { masterDb } = require('../../config/database');
const { DataTypes } = require('sequelize');

const initMasterModels = async () => {
  const SuperAdmin = require('./SuperAdmin')(masterDb, DataTypes);
  const Client = require('./Client')(masterDb, DataTypes);
  const Plan = require('./Plan')(masterDb, DataTypes);
  const Subscription = require('./Subscription')(masterDb, DataTypes);
  const ActivityLog = require('./ActivityLog')(masterDb, DataTypes);
  const SystemSetting = require('./SystemSetting')(masterDb, DataTypes);

  const models = {
    SuperAdmin,
    Client,
    Plan,
    Subscription,
    ActivityLog,
    SystemSetting
  };

  Object.values(models).forEach((model) => {
    if (model.associate) {
      model.associate(models);
    }
  });

  await masterDb.sync({ alter: true });

  return models;
};

module.exports = { initMasterModels };
