const ApiResponse = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { Category } = req.models;
    const { count, rows } = await Category.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { Category } = req.models;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }

    ApiResponse.success(res, category);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { Category } = req.models;
    const image = req.file ? req.file.path : null;

    const categoryData = {
      ...req.body,
      image
    };

    const category = await Category.create(categoryData);
    ApiResponse.created(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { Category } = req.models;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }

    const image = req.file ? req.file.path : undefined;
    const updateData = { ...req.body };
    if (image) updateData.image = image;

    await category.update(updateData);
    ApiResponse.success(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { Category } = req.models;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }

    await category.destroy();
    ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
