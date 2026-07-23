const { body } = require('express-validator');

const createSaleValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Product ID is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('paidAmount').isFloat({ min: 0 }).withMessage('Paid amount must be a positive number')
];

const holdInvoiceValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
];

module.exports = { createSaleValidation, holdInvoiceValidation };
