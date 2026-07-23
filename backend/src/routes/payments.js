const express = require('express');
const router = express.Router();

const {
  getPayments,
  getPayment,
  createPayment,
  deletePayment
} = require('../controllers/paymentController');

const { authenticate, authorizeClient } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', createPayment);
router.delete('/:id', deletePayment);

module.exports = router;
