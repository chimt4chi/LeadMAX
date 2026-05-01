const { body, query } = require('express-validator');

const doPaymentValidation = [
  body('senderAccountId')
    .notEmpty().withMessage('Sender account ID is required')
    .isUUID().withMessage('Sender account ID must be a valid UUID'),
  body('receiverAccountId')
    .notEmpty().withMessage('Receiver account ID is required')
    .isUUID().withMessage('Receiver account ID must be a valid UUID'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number (min 0.01)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Description must be at most 255 characters'),
];

const getTransactionsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['SUCCESS', 'FAILED', 'PENDING']).withMessage('Status must be SUCCESS, FAILED, or PENDING'),
];

module.exports = { doPaymentValidation, getTransactionsValidation };
