const ApiResponse = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return ApiResponse.error(res, 'Validation error', 400, errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({ field: e.path, message: `${e.path} already exists` }));
    return ApiResponse.error(res, 'Duplicate entry', 409, errors);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.error(res, 'Referenced record not found', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  if (err.type === 'entity.parse.failed') {
    return ApiResponse.error(res, 'Invalid JSON', 400);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return ApiResponse.error(res, 'File too large', 400);
  }

  return ApiResponse.error(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

module.exports = errorHandler;
