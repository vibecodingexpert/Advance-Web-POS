const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/response');
const { ROLES } = require('../utils/constants');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Access denied. No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired', 401);
    }
    return ApiResponse.error(res, 'Invalid token', 401);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
      return ApiResponse.error(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

const authorizeClient = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required', 401);
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  if (!req.user.clientDb) {
    return ApiResponse.error(res, 'Client database not configured', 403);
  }

  next();
};

module.exports = { authenticate, authorize, checkPermission, authorizeClient };
