const express = require('express');
const router = express.Router();

const {
  getVendors,
  getVendorDue,
  getVendor,
  getVendorLedger,
  createVendor,
  updateVendor,
  deleteVendor
} = require('../controllers/vendorController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getVendors);
router.get('/due', getVendorDue);
router.get('/:id', getVendor);
router.get('/:id/ledger', getVendorLedger);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', checkPermission('manage_vendors'), deleteVendor);

module.exports = router;
