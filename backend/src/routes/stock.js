const express = require('express');
const router = express.Router();

const {
  getStockHistory,
  adjustStock,
  getStockReport
} = require('../controllers/stockController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/history', getStockHistory);
router.get('/report', getStockReport);
router.post('/adjust', checkPermission('view_inventory'), adjustStock);

module.exports = router;
