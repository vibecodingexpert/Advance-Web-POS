const express = require('express');
const router = express.Router();

const {
  getSettings,
  getSettingByKey,
  updateSetting
} = require('../controllers/settingController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', checkPermission('manage_settings'), updateSetting);

module.exports = router;
