const { body } = require('express-validator');

const createProductValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('categoryId').isInt().withMessage('Category is required'),
  body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number')
];

const updateProductValidation = [
  body('name').optional(),
  body('categoryId').optional().isInt().withMessage('Category must be an integer'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be a positive number')
];

module.exports = { createProductValidation, updateProductValidation };
