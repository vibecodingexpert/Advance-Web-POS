const express = require('express');
const router = express.Router();

const {
  getPriceHistory,
  holdInvoice,
  getHeldInvoices,
  getHeldInvoice,
  deleteHeldInvoice,
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  returnSale
} = require('../controllers/saleController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getSales);
router.get('/held', getHeldInvoices);
router.get('/held/:id', getHeldInvoice);
router.get('/:id', getSale);

router.post('/price-history', getPriceHistory);
router.post('/hold', checkPermission('create_sale'), holdInvoice);
router.post('/', checkPermission('create_sale'), createSale);

router.put('/:id', checkPermission('edit_sale'), updateSale);

router.delete('/held/:id', deleteHeldInvoice);
router.delete('/:id', checkPermission('delete_sale'), deleteSale);

router.post('/:id/return', checkPermission('edit_sale'), returnSale);

module.exports = router;
