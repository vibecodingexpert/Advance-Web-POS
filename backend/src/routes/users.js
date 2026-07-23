const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  getUserPermissions,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { authenticate, authorizeClient, checkPermission } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');

router.use(authenticate, authorizeClient, tenantContext);

router.get('/', getUsers);
router.get('/:id', getUser);
router.get('/:id/permissions', getUserPermissions);
router.post('/', checkPermission('manage_users'), upload.single('image'), createUser);
router.put('/:id', checkPermission('manage_users'), upload.single('image'), updateUser);
router.delete('/:id', checkPermission('manage_users'), deleteUser);

module.exports = router;
