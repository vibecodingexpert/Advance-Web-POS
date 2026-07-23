const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { STOCK_TYPE } = require('../utils/constants');

const getStockHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { productId, type, from, to } = req.query;

    const { StockHistory, Product } = req.models;
    const where = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    }

    const { count, rows } = await StockHistory.findAndCountAll({
      where,
      include: [
        { model: Product, attributes: ['id', 'name', 'barcode'] }
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

const adjustStock = async (req, res, next) => {
  try {
    const { productId, quantity, notes } = req.body;

    const { Product, StockHistory } = req.models;
    const sequelize = req.sequelize;

    const result = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, { transaction: t });
      if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
      }

      const newQuantity = parseFloat(product.stockQuantity) + parseFloat(quantity);
      if (newQuantity < 0) {
        throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });
      }

      await product.update({ stockQuantity: newQuantity }, { transaction: t });

      const history = await StockHistory.create({
        productId,
        type: STOCK_TYPE.ADJUSTMENT,
        quantity: parseFloat(quantity),
        referenceType: 'adjustment',
        notes: notes || 'Stock adjustment',
        createdBy: req.user.id
      }, { transaction: t });

      return { product, history };
    });

    ApiResponse.success(res, result, 'Stock adjusted successfully');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const getStockReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { categoryId, brandId } = req.query;

    const { Product, Category, Brand, Unit } = req.models;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'barcode', 'stockQuantity', 'minimumStock',
        'purchasePrice', 'salePrice'
      ],
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ],
      limit,
      offset,
      order: [['stockQuantity', 'ASC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockHistory,
  adjustStock,
  getStockReport
};
