const ApiResponse = require('../utils/response');

const getAssets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { category, status } = req.query;

    const { Asset } = req.models;
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;

    const { count, rows } = await Asset.findAndCountAll({
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

const getAsset = async (req, res, next) => {
  try {
    const { Asset } = req.models;
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return ApiResponse.error(res, 'Asset not found', 404);
    }

    ApiResponse.success(res, asset);
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const { Asset } = req.models;
    const image = req.file ? req.file.path : null;

    const assetData = {
      ...req.body,
      image
    };

    const asset = await Asset.create(assetData);
    ApiResponse.created(res, asset, 'Asset created successfully');
  } catch (error) {
    next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const { Asset } = req.models;
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return ApiResponse.error(res, 'Asset not found', 404);
    }

    const image = req.file ? req.file.path : undefined;
    const updateData = { ...req.body };
    if (image) updateData.image = image;

    await asset.update(updateData);
    ApiResponse.success(res, asset, 'Asset updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const { Asset } = req.models;
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return ApiResponse.error(res, 'Asset not found', 404);
    }

    await asset.destroy();
    ApiResponse.success(res, null, 'Asset deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset
};
