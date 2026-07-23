const { body } = require('express-validator');

const createVendorValidation = [
  body('vendorName').notEmpty().withMessage('Vendor name is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

const updateVendorValidation = [
  body('vendorName').optional(),
  body('phone').optional()
];

module.exports = { createVendorValidation, updateVendorValidation };
