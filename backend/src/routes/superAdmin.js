const express = require('express');
const router = express.Router();

const {
  superAdminLogin,
  refreshToken,
  getDashboard,
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  suspendClient,
  activateClient,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  getActivityLogs
} = require('../controllers/superAdminController');

const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/login', superAdminLogin);
router.post('/refresh-token', refreshToken);

router.get('/dashboard', authenticate, authorize('super_admin'), getDashboard);
router.get('/clients', authenticate, authorize('super_admin'), getClients);
router.get('/clients/:id', authenticate, authorize('super_admin'), getClient);
router.post('/clients', authenticate, authorize('super_admin'), upload.single('logo'), createClient);
router.put('/clients/:id', authenticate, authorize('super_admin'), upload.single('logo'), updateClient);
router.delete('/clients/:id', authenticate, authorize('super_admin'), deleteClient);
router.put('/clients/:id/suspend', authenticate, authorize('super_admin'), suspendClient);
router.put('/clients/:id/activate', authenticate, authorize('super_admin'), activateClient);
router.get('/plans', authenticate, authorize('super_admin'), getPlans);
router.post('/plans', authenticate, authorize('super_admin'), createPlan);
router.put('/plans/:id', authenticate, authorize('super_admin'), updatePlan);
router.delete('/plans/:id', authenticate, authorize('super_admin'), deletePlan);
router.get('/subscriptions', authenticate, authorize('super_admin'), getSubscriptions);
router.get('/activity-logs', authenticate, authorize('super_admin'), getActivityLogs);

module.exports = router;
