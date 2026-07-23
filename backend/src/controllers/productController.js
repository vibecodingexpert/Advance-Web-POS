const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

const normalizeProductFields = (data) => {
  const result = { ...data };
  if (result.category || result.category === 0) { result.categoryId = parseInt(result.category) || null; delete result.category; }
  if (result.brand || result.brand === 0) { result.brandId = parseInt(result.brand) || null; delete result.brand; }
  if (result.unit || result.unit === 0) { result.unitId = parseInt(result.unit) || null; delete result.unit; }
  if (result.stock || result.stock === 0 || result.stock === '0') { result.stockQuantity = parseFloat(result.stock) || 0; delete result.stock; }
  if (result.minStock || result.minStock === 0 || result.minStock === '0') { result.minimumStock = parseFloat(result.minStock) || 0; delete result.minStock; }
  return result;
};

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let { categoryId, category, brandId, brand, status } = req.query;

    if (!categoryId && category) categoryId = category;
    if (!brandId && brand) brandId = brand;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    const { Product, Category, Brand, Unit } = req.models;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const { Product, Category, Brand, Unit } = req.models;
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ]
    });

    if (!product) {
      return ApiResponse.error(res, 'Product not found', 404);
    }

    ApiResponse.success(res, product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { Product } = req.models;
    const image = req.file ? req.file.path : null;

    const productData = normalizeProductFields({
      ...req.body,
      image
    });

    const product = await Product.create(productData);
    ApiResponse.created(res, product, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { Product } = req.models;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return ApiResponse.error(res, 'Product not found', 404);
    }

    const image = req.file ? req.file.path : undefined;
    const updateData = normalizeProductFields({ ...req.body });
    if (image) updateData.image = image;

    await product.update(updateData);
    ApiResponse.success(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { Product } = req.models;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return ApiResponse.error(res, 'Product not found', 404);
    }

    await product.destroy();
    ApiResponse.success(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q, barcode } = req.query;
    const { Product, Category, Brand, Unit } = req.models;

    const where = {};

    if (barcode) {
      where.barcode = barcode;
    } else if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { barcode: { [Op.like]: `%${q}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ],
      limit: 20
    });

    ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const { Product, Category, Brand, Unit } = req.models;

    const products = await Product.findAll({
      where: {
        stockQuantity: { [Op.lte]: req.sequelize.col('minimum_stock') }
      },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ],
      order: [
        [req.sequelize.literal('stock_quantity'), 'ASC']
      ]
    });

    ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const getBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const { Product, Category, Brand, Unit } = req.models;

    const product = await Product.findOne({
      where: { barcode },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ]
    });

    if (!product) {
      return ApiResponse.error(res, 'Product not found', 404);
    }

    ApiResponse.success(res, product);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStock,
  getBarcode
};
