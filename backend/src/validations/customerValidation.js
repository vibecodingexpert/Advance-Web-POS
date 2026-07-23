const { body } = require('express-validator');

const createCustomerValidation = [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

const updateCustomerValidation = [
  body('name').optional(),
  body('phone').optional(),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

module.exports = { createCustomerValidation, updateCustomerValidation };
