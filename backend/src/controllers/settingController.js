const ApiResponse = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { Setting } = req.models;

    const { count, rows } = await Setting.findAndCountAll({
      limit,
      offset,
      order: [['key', 'ASC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getSettingByKey = async (req, res, next) => {
  try {
    const { Setting } = req.models;
    const setting = await Setting.findOne({ where: { key: req.params.key } });

    if (!setting) {
      return ApiResponse.error(res, 'Setting not found', 404);
    }

    ApiResponse.success(res, setting);
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { Setting } = req.models;
    const { key } = req.params;
    const { value } = req.body;

    const [setting, created] = await Setting.findOrCreate({
      where: { key },
      defaults: { key, value }
    });

    if (!created) {
      await setting.update({ value });
    }

    ApiResponse.success(res, setting, 'Setting updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  getSettingByKey,
  updateSetting
};
