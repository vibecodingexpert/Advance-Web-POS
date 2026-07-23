const { getClientDb } = require('../config/database');
const { initClientModels } = require('../models/client');

const tenantContext = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      return next();
    }

    const dbName = req.user.clientDb;
    if (!dbName) {
      return res.status(403).json({
        success: false,
        message: 'Client database not configured'
      });
    }

    const sequelize = getClientDb(dbName);
    await sequelize.authenticate();
    const models = initClientModels(sequelize);

    req.models = models;
    req.sequelize = sequelize;

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize client database context'
    });
  }
};

module.exports = tenantContext;
