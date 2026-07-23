const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const { Customer } = req.models;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    ApiResponse.success(res, customer);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const customer = await Customer.create(req.body);
    ApiResponse.created(res, customer, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    await customer.update(req.body);
    ApiResponse.success(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    await customer.destroy();
    ApiResponse.success(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getCustomerLedger = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { CustomerLedger } = req.models;
    const customerId = req.params.id;

    const customer = await req.models.Customer.findByPk(customerId);
    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    const { count, rows } = await CustomerLedger.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getCustomerDue = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { Customer } = req.models;

    const { count, rows } = await Customer.findAndCountAll({
      where: { dueAmount: { [Op.gt]: 0 } },
      limit,
      offset,
      order: [['dueAmount', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerDue
};
