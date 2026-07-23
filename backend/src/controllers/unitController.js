const ApiResponse = require('../utils/response');

const getUnits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { Unit } = req.models;
    const { count, rows } = await Unit.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getUnit = async (req, res, next) => {
  try {
    const { Unit } = req.models;
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return ApiResponse.error(res, 'Unit not found', 404);
    }

    ApiResponse.success(res, unit);
  } catch (error) {
    next(error);
  }
};

const createUnit = async (req, res, next) => {
  try {
    const { Unit } = req.models;
    const unit = await Unit.create(req.body);
    ApiResponse.created(res, unit, 'Unit created successfully');
  } catch (error) {
    next(error);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const { Unit } = req.models;
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return ApiResponse.error(res, 'Unit not found', 404);
    }

    await unit.update(req.body);
    ApiResponse.success(res, unit, 'Unit updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUnit = async (req, res, next) => {
  try {
    const { Unit } = req.models;
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return ApiResponse.error(res, 'Unit not found', 404);
    }

    await unit.destroy();
    ApiResponse.success(res, null, 'Unit deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
};
