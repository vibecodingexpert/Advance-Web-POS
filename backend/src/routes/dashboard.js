const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getTodaySales,
  getChartData
} = require('../controllers/dashboardController');

const { authenticate, authorizeClient } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/stats', getDashboardStats);
router.get('/today-sales', getTodaySales);
router.get('/chart-data', getChartData);

module.exports = router;
