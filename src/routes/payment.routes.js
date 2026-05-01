const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { doPayment, getTransactions } = require('../controllers/payment.controller');
const { doPaymentValidation, getTransactionsValidation } = require('../validators/payment.validators');

// All payment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/payments
 * @desc    4.1 Do Payment (sender → receiver with balance check)
 * @access  Private
 */
router.post('/', doPaymentValidation, validate, doPayment);

/**
 * @route   GET /api/v1/payments/transactions
 * @desc    4.2 Get Transactions List by User (paginated, filterable by status)
 * @access  Private
 */
router.get('/transactions', getTransactionsValidation, validate, getTransactions);

module.exports = router;
