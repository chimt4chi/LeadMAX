const BankAccount = require('../models/bankAccount.model');

const MAX_ACCOUNTS_PER_USER = 3;

// ─── 3.1 Add Bank Account ────────────────────────────────────────────────────
async function addBankAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { accountNumber, bankName, accountHolderName } = req.body;

    // Enforce max 3 accounts per user
    const existingCount = await BankAccount.count({ where: { userId, isActive: true } });
    if (existingCount >= MAX_ACCOUNTS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `A user can have a maximum of ${MAX_ACCOUNTS_PER_USER} bank accounts`,
      });
    }

    // Check duplicate account number globally
    const duplicate = await BankAccount.findOne({ where: { accountNumber } });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Account number already exists' });
    }

    const account = await BankAccount.create({
      userId,
      accountNumber,
      bankName,
      accountHolderName,
      balance: 0.00,
    });

    return res.status(201).json({
      success: true,
      message: 'Bank account added successfully',
      data: { account },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 3.2 Get User Bank Accounts ───────────────────────────────────────────────
async function getBankAccounts(req, res, next) {
  try {
    const userId = req.user.id;

    const accounts = await BankAccount.findAll({
      where: { userId, isActive: true },
      order: [['createdAt', 'ASC']],
    });

    return res.json({
      success: true,
      data: {
        accounts,
        total: accounts.length,
        maxAllowed: MAX_ACCOUNTS_PER_USER,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 3.3 Delete Bank Account ─────────────────────────────────────────────────
async function deleteBankAccount(req, res, next) {
  try {
    const userId    = req.user.id;
    const { id }    = req.params;

    const account = await BankAccount.findOne({ where: { id, userId, isActive: true } });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    // Soft-delete
    await account.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Bank account deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ─── 3.4 Top-up Balance ───────────────────────────────────────────────────────
async function topUpBalance(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;

    const account = await BankAccount.findOne({ where: { id, userId, isActive: true } });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const newBalance = parseFloat(account.balance) + topUpAmount;
    await account.update({ balance: newBalance.toFixed(2) });

    return res.json({
      success: true,
      message: `Successfully topped up ${topUpAmount.toFixed(2)} to account`,
      data: {
        accountId:  account.id,
        topUpAmount: topUpAmount.toFixed(2),
        previousBalance: parseFloat(account.balance).toFixed(2),
        newBalance: newBalance.toFixed(2),
        currency: 'INR',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { addBankAccount, getBankAccounts, deleteBankAccount, topUpBalance };
