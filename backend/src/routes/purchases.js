const express = require('express');
const router = express.Router();

const {
  getPurchases,
  getPurchase,
  getPurchasePriceHistory,
  createPurchase,
  updatePurchase,
  deletePurchase,
  returnPurchase
} = require('../controllers/purchaseController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getPurchases);
router.get('/price-history/:productId', getPurchasePriceHistory);
router.get('/:id', getPurchase);
router.post('/', checkPermission('create_purchase'), createPurchase);
router.put('/:id', checkPermission('edit_purchase'), updatePurchase);
router.delete('/:id', checkPermission('delete_purchase'), deletePurchase);
router.post('/:id/return', checkPermission('edit_purchase'), returnPurchase);

module.exports = router;
