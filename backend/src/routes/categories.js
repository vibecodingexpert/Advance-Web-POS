const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', checkPermission('manage_categories'), upload.single('image'), createCategory);
router.put('/:id', checkPermission('manage_categories'), upload.single('image'), updateCategory);
router.delete('/:id', checkPermission('manage_categories'), deleteCategory);

module.exports = router;
