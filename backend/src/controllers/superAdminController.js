const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { masterDb, getClientDb } = require('../config/database');
const { sanitizeDbName } = require('../utils/helpers');
const { ROLES, CLIENT_STATUS } = require('../utils/constants');
const { getMasterModels } = require('../models/master');
const { setupNewClient, dropClientDatabase } = require('../services/databaseService');
const { createDefaultRoles } = require('../services/seedService');
const { initClientModels } = require('../models/client');

const superAdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { SuperAdmin } = getMasterModels();

    const admin = await SuperAdmin.findOne({ where: { email } });
    if (!admin) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    if (admin.status !== 'active') {
      return ApiResponse.error(res, 'Account is inactive', 403);
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: ROLES.SUPER_ADMIN },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { id: admin.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await admin.update({ lastLogin: new Date() });

    ApiResponse.success(res, {
      token,
      refreshToken,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        image: admin.image,
        role: ROLES.SUPER_ADMIN
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }

    const { SuperAdmin } = getMasterModels();
    const admin = await SuperAdmin.findByPk(decoded.id);
    if (!admin || admin.status !== 'active') {
      return ApiResponse.error(res, 'Admin not found or inactive', 401);
    }

    const newToken = jwt.sign(
      { id: admin.id, email: admin.email, role: ROLES.SUPER_ADMIN },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const newRefreshToken = jwt.sign(
      { id: admin.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    ApiResponse.success(res, { token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Invalid or expired refresh token', 401);
    }
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const { Client, Plan, Subscription } = getMasterModels();
    const totalClients = await Client.count();
    const activeClients = await Client.count({ where: { status: CLIENT_STATUS.ACTIVE } });
    const expiredClients = await Client.count({ where: { status: CLIENT_STATUS.EXPIRED } });
    const suspendedClients = await Client.count({ where: { status: CLIENT_STATUS.SUSPENDED } });

    const recentClients = await Client.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
    const plans = await Plan.findAll();
    const totalSubscriptions = await Subscription.count();

    const monthlyClients = await Client.count({
      where: { createdAt: { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6)) } }
    });

    ApiResponse.success(res, {
      stats: { totalClients, activeClients, expiredClients, suspendedClients, totalSubscriptions },
      recentClients,
      plans: plans.map(p => ({ name: p.name, count: 0 })),
      monthlyClients
    });
  } catch (error) {
    next(error);
  }
};

const getClients = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { businessName: { [Op.like]: `%${search}%` } },
        { ownerName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Client.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getClient = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const client = await Client.findByPk(req.params.id);
    if (!client) return ApiResponse.error(res, 'Client not found', 404);
    ApiResponse.success(res, client);
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  try {
    const { businessName, ownerName, email, phone, address, city, country, password = 'password123' } = req.body;
    const logo = req.file ? req.file.path : null;
    const { Client } = getMasterModels();

    const existing = await Client.findOne({ where: { email } });
    if (existing) return ApiResponse.error(res, 'Client with this email already exists', 409);

    const databaseName = sanitizeDbName(businessName);

    const client = await Client.create({ businessName, ownerName, email, phone, address, city, country, logo, databaseName });
    await setupNewClient(databaseName);

    const sequelize = getClientDb(databaseName);
    await createDefaultRoles(sequelize);

    const models = initClientModels(sequelize);
    const hashedPassword = await bcrypt.hash(password, 12);

    const adminRole = await models.Role.findOne({ where: { slug: ROLES.ADMIN } });
    await models.User.create({ name: ownerName, email, password: hashedPassword, phone, roleId: adminRole ? adminRole.id : null });

    ApiResponse.created(res, client, 'Client created successfully');
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const client = await Client.findByPk(req.params.id);
    if (!client) return ApiResponse.error(res, 'Client not found', 404);

    const { businessName, ownerName, email, phone, address, city, country, password } = req.body;
    const logo = req.file ? req.file.path : undefined;

    const updateData = {};
    if (businessName) updateData.businessName = businessName;
    if (ownerName) updateData.ownerName = ownerName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (logo) updateData.logo = logo;

    await client.update(updateData);

    if (password && client.databaseName) {
      try {
        const sequelize = getClientDb(client.databaseName);
        const models = initClientModels(sequelize);
        const hashedPassword = await bcrypt.hash(password, 12);
        await models.User.update({ password: hashedPassword }, { where: { email: client.email } });
      } catch (err) {
        console.error('Failed to update client user password:', err);
      }
    }

    ApiResponse.success(res, client, 'Client updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const client = await Client.findByPk(req.params.id);
    if (!client) return ApiResponse.error(res, 'Client not found', 404);

    await dropClientDatabase(client.databaseName);
    await client.destroy();
    ApiResponse.success(res, null, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
};

const suspendClient = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const client = await Client.findByPk(req.params.id);
    if (!client) return ApiResponse.error(res, 'Client not found', 404);

    await client.update({ status: CLIENT_STATUS.SUSPENDED });
    ApiResponse.success(res, client, 'Client suspended successfully');
  } catch (error) {
    next(error);
  }
};

const activateClient = async (req, res, next) => {
  try {
    const { Client } = getMasterModels();
    const client = await Client.findByPk(req.params.id);
    if (!client) return ApiResponse.error(res, 'Client not found', 404);

    await client.update({ status: CLIENT_STATUS.ACTIVE });
    ApiResponse.success(res, client, 'Client activated successfully');
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const { Plan } = getMasterModels();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Plan.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { name, price, duration, maxUsers, maxProducts, features, status } = req.body;
    const { Plan } = getMasterModels();

    const plan = await Plan.create({ name, price, duration, maxUsers, maxProducts, features, status });
    ApiResponse.created(res, plan, 'Plan created successfully');
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { Plan } = getMasterModels();
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return ApiResponse.error(res, 'Plan not found', 404);

    const { name, price, duration, maxUsers, maxProducts, features, status } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (duration) updateData.duration = duration;
    if (maxUsers) updateData.maxUsers = maxUsers;
    if (maxProducts) updateData.maxProducts = maxProducts;
    if (features !== undefined) updateData.features = features;
    if (status) updateData.status = status;

    await plan.update(updateData);
    ApiResponse.success(res, plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { Plan } = getMasterModels();
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return ApiResponse.error(res, 'Plan not found', 404);

    await plan.destroy();
    ApiResponse.success(res, null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const { Subscription, Client, Plan } = getMasterModels();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Subscription.findAndCountAll({
      include: [{ model: Client }, { model: Plan }],
      limit, offset, order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const { ActivityLog } = getMasterModels();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await ActivityLog.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  superAdminLogin, refreshToken, getDashboard, getClients, getClient,
  createClient, updateClient, deleteClient, suspendClient, activateClient,
  getPlans, createPlan, updatePlan, deletePlan, getSubscriptions, getActivityLogs
};
