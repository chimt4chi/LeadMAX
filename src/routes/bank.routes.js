const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const {
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  topUpBalance,
} = require('../controllers/bank.controller');
const {
  addBankAccountValidation,
  bankAccountIdParamValidation,
  topUpValidation,
} = require('../validators/bank.validators');

// All bank account routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/bank-accounts
 * @desc    3.1 Add User Bank Account (max 3 per user)
 * @access  Private
 */
router.post('/', addBankAccountValidation, validate, addBankAccount);

/**
 * @route   GET /api/v1/bank-accounts
 * @desc    3.2 Get User Bank Accounts List
 * @access  Private
 */
router.get('/', getBankAccounts);

/**
 * @route   DELETE /api/v1/bank-accounts/:id
 * @desc    3.3 Delete User Bank Account
 * @access  Private
 */
router.delete('/:id', bankAccountIdParamValidation, validate, deleteBankAccount);

/**
 * @route   POST /api/v1/bank-accounts/:id/topup
 * @desc    3.4 Top-up User Bank Account Balance
 * @access  Private
 */
router.post('/:id/topup', topUpValidation, validate, topUpBalance);

module.exports = router;
