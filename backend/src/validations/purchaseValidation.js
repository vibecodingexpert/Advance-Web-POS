const { body } = require('express-validator');

const createPurchaseValidation = [
  body('vendorId').isInt().withMessage('Vendor is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Product ID is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number')
];

module.exports = { createPurchaseValidation };
