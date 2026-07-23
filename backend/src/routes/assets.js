const express = require('express');
const router = express.Router();

const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset
} = require('../controllers/assetController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getAssets);
router.get('/:id', getAsset);
router.post('/', checkPermission('manage_assets'), upload.single('image'), createAsset);
router.put('/:id', checkPermission('manage_assets'), upload.single('image'), updateAsset);
router.delete('/:id', checkPermission('manage_assets'), deleteAsset);

module.exports = router;
