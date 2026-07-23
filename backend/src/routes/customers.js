const express = require('express');
const router = express.Router();

const {
  getCustomers,
  getCustomerDue,
  getCustomer,
  getCustomerLedger,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getCustomers);
router.get('/due', getCustomerDue);
router.get('/:id', getCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', checkPermission('manage_customers'), deleteCustomer);

module.exports = router;
