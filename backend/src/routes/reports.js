const express = require('express');
const router = express.Router();

const {
  getSalesReport,
  getPurchaseReport,
  getProfitLoss,
  getStockReport,
  getDayBook,
  getCashBook,
  getCustomerLedger,
  getVendorLedger,
  exportPDF,
  exportExcel
} = require('../controllers/reportController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/export/pdf', exportPDF);
router.get('/export/excel', exportExcel);

router.get('/sales', checkPermission('view_reports'), getSalesReport);
router.get('/purchases', checkPermission('view_reports'), getPurchaseReport);
router.get('/profit-loss', checkPermission('view_reports'), getProfitLoss);
router.get('/stock', checkPermission('view_reports'), getStockReport);
router.get('/day-book', checkPermission('view_reports'), getDayBook);
router.get('/cash-book', checkPermission('view_reports'), getCashBook);
router.get('/customers/:id/ledger', checkPermission('view_reports'), getCustomerLedger);
router.get('/vendors/:id/ledger', checkPermission('view_reports'), getVendorLedger);

module.exports = router;
