const express = require('express');
const router = express.Router();

const {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getUnits);
router.get('/:id', getUnit);
router.post('/', checkPermission('manage_units'), createUnit);
router.put('/:id', checkPermission('manage_units'), updateUnit);
router.delete('/:id', checkPermission('manage_units'), deleteUnit);

module.exports = router;
