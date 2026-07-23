const express = require('express');
const router = express.Router();

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getBrands);
router.get('/:id', getBrand);
router.post('/', checkPermission('manage_brands'), upload.single('image'), createBrand);
router.put('/:id', checkPermission('manage_brands'), upload.single('image'), updateBrand);
router.delete('/:id', checkPermission('manage_brands'), deleteBrand);

module.exports = router;
