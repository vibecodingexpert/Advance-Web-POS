const ApiResponse = require('../utils/response');

const getBrands = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { Brand } = req.models;
    const { count, rows } = await Brand.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getBrand = async (req, res, next) => {
  try {
    const { Brand } = req.models;
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return ApiResponse.error(res, 'Brand not found', 404);
    }

    ApiResponse.success(res, brand);
  } catch (error) {
    next(error);
  }
};

const createBrand = async (req, res, next) => {
  try {
    const { Brand } = req.models;
    const image = req.file ? req.file.path : null;

    const brandData = {
      ...req.body,
      image
    };

    const brand = await Brand.create(brandData);
    ApiResponse.created(res, brand, 'Brand created successfully');
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { Brand } = req.models;
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return ApiResponse.error(res, 'Brand not found', 404);
    }

    const image = req.file ? req.file.path : undefined;
    const updateData = { ...req.body };
    if (image) updateData.image = image;

    await brand.update(updateData);
    ApiResponse.success(res, brand, 'Brand updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const { Brand } = req.models;
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return ApiResponse.error(res, 'Brand not found', 404);
    }

    await brand.destroy();
    ApiResponse.success(res, null, 'Brand deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
};
