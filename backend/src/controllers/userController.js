const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const { User, Role } = req.models;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Role, attributes: ['id', 'name', 'slug'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { User, Role } = req.models;
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, attributes: ['id', 'name', 'slug'] }]
    });

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, roleId, status } = req.body;
    const image = req.file ? req.file.path : null;

    const { User } = req.models;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return ApiResponse.error(res, 'User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      roleId,
      image,
      status: status || 'active'
    });

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: req.models.Role, attributes: ['id', 'name', 'slug'] }]
    });

    ApiResponse.created(res, createdUser, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { User, Role } = req.models;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const { name, email, phone, password, roleId, status } = req.body;
    const image = req.file ? req.file.path : undefined;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roleId) updateData.roleId = roleId;
    if (status) updateData.status = status;
    if (image) updateData.image = image;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, attributes: ['id', 'name', 'slug'] }]
    });

    ApiResponse.success(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { User } = req.models;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    await user.destroy();
    ApiResponse.success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getUserPermissions = async (req, res, next) => {
  try {
    const { User, Role, Permission } = req.models;
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          include: [{ model: Permission, attributes: ['id', 'name', 'slug', 'module'] }]
        }
      ]
    });

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions
};
