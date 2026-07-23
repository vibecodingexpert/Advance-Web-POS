const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

const getVendors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const { Vendor } = req.models;
    const where = {};

    if (search) {
      where[Op.or] = [
        { vendorName: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Vendor.findAndCountAll({
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

const getVendor = async (req, res, next) => {
  try {
    const { Vendor } = req.models;
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return ApiResponse.error(res, 'Vendor not found', 404);
    }

    ApiResponse.success(res, vendor);
  } catch (error) {
    next(error);
  }
};

const normalizeVendorFields = (data) => {
  const result = { ...data };
  if (result.name) { result.vendorName = result.name; delete result.name; }
  if (result.company) { result.companyName = result.company; delete result.company; }
  return result;
};

const createVendor = async (req, res, next) => {
  try {
    const { Vendor } = req.models;
    const vendor = await Vendor.create(normalizeVendorFields(req.body));
    ApiResponse.created(res, vendor, 'Vendor created successfully');
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const { Vendor } = req.models;
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return ApiResponse.error(res, 'Vendor not found', 404);
    }

    await vendor.update(normalizeVendorFields(req.body));
    ApiResponse.success(res, vendor, 'Vendor updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    const { Vendor } = req.models;
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return ApiResponse.error(res, 'Vendor not found', 404);
    }

    await vendor.destroy();
    ApiResponse.success(res, null, 'Vendor deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getVendorLedger = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { VendorLedger } = req.models;
    const vendorId = req.params.id;

    const vendor = await req.models.Vendor.findByPk(vendorId);
    if (!vendor) {
      return ApiResponse.error(res, 'Vendor not found', 404);
    }

    const { count, rows } = await VendorLedger.findAndCountAll({
      where: { vendorId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getVendorDue = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { Vendor } = req.models;

    const { count, rows } = await Vendor.findAndCountAll({
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
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorLedger,
  getVendorDue
};
