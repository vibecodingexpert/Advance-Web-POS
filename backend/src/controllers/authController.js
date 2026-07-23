const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DataTypes } = require('sequelize');
const ApiResponse = require('../utils/response');
const { masterDb, getClientDb } = require('../config/database');
const SuperAdmin = require('../models/master/SuperAdmin')(masterDb, DataTypes);
const Client = require('../models/master/Client')(masterDb, DataTypes);
const { initClientModels } = require('../models/client');
const { ROLES } = require('../utils/constants');

const superAdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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

const clientLogin = async (req, res, next) => {
  try {
    const { email, password, clientDb } = req.body;

    let client;
    if (clientDb) {
      client = await Client.findOne({ where: { databaseName: clientDb } });
    } else {
      client = await Client.findOne({ where: { email } });
    }

    if (!client) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    if (client.status !== 'active') {
      return ApiResponse.error(res, 'Client account is not active', 403);
    }

    const sequelize = getClientDb(client.databaseName);
    await sequelize.authenticate();
    const models = initClientModels(sequelize);

    const user = await models.User.findOne({
      where: { email },
      include: [{ model: models.Role, include: [models.Permission] }]
    });

    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return ApiResponse.error(res, 'User account is inactive', 403);
    }

    const permissions = user.Role ? user.Role.Permissions.map(p => p.slug) : [];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role ? user.Role.slug : ROLES.EMPLOYEE,
        clientDb: client.databaseName,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, clientDb: client.databaseName, type: 'refresh' },
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
        role: user.Role ? user.Role.slug : null,
        roleName: user.Role ? user.Role.name : null,
        permissions,
        clientDb: client.databaseName
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

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }

    if (decoded.clientDb) {
      const client = await Client.findOne({ where: { databaseName: decoded.clientDb } });
      if (!client || client.status !== 'active') {
        return ApiResponse.error(res, 'Client account is not active', 403);
      }

      const sequelize = getClientDb(client.databaseName);
      await sequelize.authenticate();
      const models = initClientModels(sequelize);

      const user = await models.User.findByPk(decoded.id, {
        include: [{ model: models.Role, include: [models.Permission] }]
      });

      if (!user || user.status !== 'active') {
        return ApiResponse.error(res, 'User not found or inactive', 401);
      }

      const permissions = user.Role ? user.Role.Permissions.map(p => p.slug) : [];

      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.Role ? user.Role.slug : ROLES.EMPLOYEE,
          clientDb: client.databaseName,
          permissions
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      const newRefreshToken = jwt.sign(
        { id: user.id, clientDb: client.databaseName, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return ApiResponse.success(res, { token: newToken, refreshToken: newRefreshToken });
    }

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

const logout = async (req, res, next) => {
  try {
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.SUPER_ADMIN) {
      const admin = await SuperAdmin.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      if (!admin) {
        return ApiResponse.error(res, 'Admin not found', 404);
      }
      return ApiResponse.success(res, admin);
    }

    const User = req.models.User;
    const Role = req.models.Role;

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role }]
    });

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, image } = req.body;
    const profileImage = req.file ? req.file.path : image;

    if (req.user.role === ROLES.SUPER_ADMIN) {
      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (profileImage) updateData.image = profileImage;

      await SuperAdmin.update(updateData, { where: { id: req.user.id } });
      const admin = await SuperAdmin.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      return ApiResponse.success(res, admin, 'Profile updated successfully');
    }

    const User = req.models.User;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.image = profileImage;

    await User.update(updateData, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  superAdminLogin,
  clientLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile
};
