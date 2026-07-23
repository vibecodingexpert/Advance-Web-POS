const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const clientLoginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('clientDb').notEmpty().withMessage('Client database is required')
];

module.exports = { loginValidation, clientLoginValidation };
