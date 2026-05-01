const { body, param } = require('express-validator');

const addBankAccountValidation = [
  body('accountNumber')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .isLength({ min: 5, max: 30 }).withMessage('Account number must be 5–30 characters')
    .matches(/^[A-Z0-9]+$/).withMessage('Account number must be alphanumeric uppercase'),
  body('bankName')
    .trim()
    .notEmpty().withMessage('Bank name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Bank name must be 2–100 characters'),
  body('accountHolderName')
    .trim()
    .notEmpty().withMessage('Account holder name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Account holder name must be 2–100 characters'),
];

const bankAccountIdParamValidation = [
  param('id').isUUID().withMessage('Invalid bank account ID'),
];

const topUpValidation = [
  param('id').isUUID().withMessage('Invalid bank account ID'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number (min 0.01)'),
];

module.exports = {
  addBankAccountValidation,
  bankAccountIdParamValidation,
  topUpValidation,
};
