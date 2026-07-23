const express = require('express');
const router = express.Router();

const {
  getProducts,
  searchProducts,
  getLowStock,
  getBarcode,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/low-stock', getLowStock);
router.get('/barcode/:barcode', getBarcode);
router.get('/:id', getProduct);
router.post('/', checkPermission('manage_products'), upload.single('image'), createProduct);
router.put('/:id', checkPermission('manage_products'), upload.single('image'), updateProduct);
router.delete('/:id', checkPermission('manage_products'), deleteProduct);

module.exports = router;
