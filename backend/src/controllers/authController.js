const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/response');
const { getClientDb } = require('../config/database');
const { getMasterModels } = require('../models/master');
const { initClientModels } = require('../models/client');
const { ROLES } = require('../utils/constants');

const clientLogin = async (req, res, next) => {
  try {
    const { email, password, clientDb } = req.body;

    if (!clientDb) {
      return ApiResponse.error(res, 'Client database is required', 400);
    }

    const { Client } = getMasterModels();
    const client = await Client.findOne({ where: { databaseName: clientDb, status: 'active' } });
    if (!client) {
      return ApiResponse.error(res, 'Invalid client database or client is inactive', 401);
    }

    const sequelize = getClientDb(clientDb);
    const models = await initClientModels(sequelize);

    const user = await models.User.findOne({
      where: { email },
      include: [{ model: models.Role }]
    });

    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return ApiResponse.error(res, 'Account is inactive', 403);
    }

    const permissions = user.Role ? await user.Role.getPermissions() : [];
    const permissionSlugs = permissions.map(p => p.slug);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.Role ? user.Role.slug : ROLES.EMPLOYEE, clientDb, permissions: permissionSlugs },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh', clientDb },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await user.update({ lastLogin: new Date() });

    ApiResponse.success(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.Role ? user.Role.slug : ROLES.EMPLOYEE,
        businessName: client.businessName,
        clientDb
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

    if (decoded.clientDb) {
      const sequelize = getClientDb(decoded.clientDb);
      const models = await initClientModels(sequelize);
      const user = await models.User.findByPk(decoded.id);
      if (!user || user.status !== 'active') {
        return ApiResponse.error(res, 'User not found or inactive', 401);
      }
    }

    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role, clientDb: decoded.clientDb },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, type: 'refresh', clientDb: decoded.clientDb },
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

const getProfile = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.SUPER_ADMIN) {
      const { SuperAdmin } = getMasterModels();
      const admin = await SuperAdmin.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      return ApiResponse.success(res, admin);
    }

    if (req.user.clientDb) {
      const sequelize = getClientDb(req.user.clientDb);
      const models = await initClientModels(sequelize);
      const user = await models.User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: models.Role }]
      });
      return ApiResponse.success(res, user);
    }

    ApiResponse.error(res, 'User not found', 404);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (req.user.role === ROLES.SUPER_ADMIN) {
      const { SuperAdmin } = getMasterModels();
      const admin = await SuperAdmin.findByPk(req.user.id);
      if (!admin) return ApiResponse.error(res, 'Admin not found', 404);

      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (req.file) updateData.image = req.file.path;

      await admin.update(updateData);
      return ApiResponse.success(res, admin, 'Profile updated');
    }

    if (req.user.clientDb) {
      const sequelize = getClientDb(req.user.clientDb);
      const models = await initClientModels(sequelize);
      const user = await models.User.findByPk(req.user.id);
      if (!user) return ApiResponse.error(res, 'User not found', 404);

      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (req.file) updateData.image = req.file.path;

      await user.update(updateData);
      return ApiResponse.success(res, user, 'Profile updated');
    }

    ApiResponse.error(res, 'User not found', 404);
  } catch (error) {
    next(error);
  }
};

module.exports = { clientLogin, refreshToken, getProfile, updateProfile };
