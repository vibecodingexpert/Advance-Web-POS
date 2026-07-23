const express = require('express');
const router = express.Router();

const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', checkPermission('manage_expenses'), createExpense);
router.put('/:id', checkPermission('manage_expenses'), updateExpense);
router.delete('/:id', checkPermission('manage_expenses'), deleteExpense);

module.exports = router;
