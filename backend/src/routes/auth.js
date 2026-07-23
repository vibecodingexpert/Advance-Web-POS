const express = require('express');
const router = express.Router();

const {
  superAdminLogin,
  clientLogin,
  refreshToken,
  getProfile,
  updateProfile
} = require('../controllers/authController');

const { authenticate, authorizeClient } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.post('/super-admin/login', superAdminLogin);
router.post('/client/login', clientLogin);
router.post('/refresh-token', refreshToken);

router.get('/profile', authenticate, authorizeClient, tenantContext, getProfile);
router.put('/profile', authenticate, authorizeClient, tenantContext, upload.single('image'), updateProfile);

module.exports = router;
