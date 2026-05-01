const { sequelize } = require('../database/connection');
const BankAccount = require('../models/bankAccount.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

// ─── 4.1 Do Payment ───────────────────────────────────────────────────────────
/**
 * Payment Flow:
 *  1. Validate sender account belongs to authenticated user
 *  2. Validate receiver account exists and is active
 *  3. Ensure sender != receiver account
 *  4. Check sufficient balance
 *  5. Execute atomic DB transaction:
 *       - Deduct from sender
 *       - Add to receiver
 *       - Create Transaction record as SUCCESS
 *  6. On any failure: create Transaction record as FAILED
 */
async function doPayment(req, res, next) {
  const dbTransaction = await sequelize.transaction();
  let transactionRecord = null;

  try {
    const senderId         = req.user.id;
    const { senderAccountId, receiverAccountId, amount, description } = req.body;

    const paymentAmount = parseFloat(amount);

    // ── Validate sender account ────────────────────────────────────────────
    const senderAccount = await BankAccount.findOne({
      where: { id: senderAccountId, userId: senderId, isActive: true },
      lock: dbTransaction.LOCK.UPDATE,
      transaction: dbTransaction,
    });

    if (!senderAccount) {
      await dbTransaction.rollback();
      return res.status(404).json({ success: false, message: 'Sender bank account not found or does not belong to you' });
    }

    // ── Validate receiver account ──────────────────────────────────────────
    const receiverAccount = await BankAccount.findOne({
      where: { id: receiverAccountId, isActive: true },
      lock: dbTransaction.LOCK.UPDATE,
      transaction: dbTransaction,
    });

    if (!receiverAccount) {
      await dbTransaction.rollback();

      // Log failed transaction (no accounts to link properly)
      await Transaction.create({
        senderId,
        receiverId:        'unknown',
        senderAccountId,
        receiverAccountId,
        amount:            paymentAmount,
        status:            'FAILED',
        description,
        failureReason:     'Receiver bank account not found or inactive',
      });

      return res.status(404).json({ success: false, message: 'Receiver bank account not found or inactive' });
    }

    if (senderAccountId === receiverAccountId) {
      await dbTransaction.rollback();
      return res.status(400).json({ success: false, message: 'Sender and receiver accounts cannot be the same' });
    }

    // Get receiver's userId
    const receiverId = receiverAccount.userId;

    // ── Check balance ──────────────────────────────────────────────────────
    const currentBalance = parseFloat(senderAccount.balance);
    if (currentBalance < paymentAmount) {
      await dbTransaction.rollback();

      // Record failed transaction
      transactionRecord = await Transaction.create({
        senderId,
        receiverId,
        senderAccountId,
        receiverAccountId,
        amount:        paymentAmount,
        status:        'FAILED',
        description,
        failureReason: `Insufficient balance. Available: ${currentBalance.toFixed(2)}, Required: ${paymentAmount.toFixed(2)}`,
      });

      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        data: {
          availableBalance: currentBalance.toFixed(2),
          requiredAmount:   paymentAmount.toFixed(2),
          shortfall:        (paymentAmount - currentBalance).toFixed(2),
          transactionId:    transactionRecord.id,
          status:           'FAILED',
        },
      });
    }

    // ── Execute atomic transfer ────────────────────────────────────────────
    const newSenderBalance   = (currentBalance - paymentAmount).toFixed(2);
    const newReceiverBalance = (parseFloat(receiverAccount.balance) + paymentAmount).toFixed(2);

    await senderAccount.update(
      { balance: newSenderBalance },
      { transaction: dbTransaction }
    );

    await receiverAccount.update(
      { balance: newReceiverBalance },
      { transaction: dbTransaction }
    );

    transactionRecord = await Transaction.create({
      senderId,
      receiverId,
      senderAccountId,
      receiverAccountId,
      amount:      paymentAmount,
      status:      'SUCCESS',
      description,
    }, { transaction: dbTransaction });

    await dbTransaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Payment successful',
      data: {
        transaction: {
          id:               transactionRecord.id,
          referenceId:      transactionRecord.referenceId,
          amount:           paymentAmount.toFixed(2),
          currency:         transactionRecord.currency,
          status:           'SUCCESS',
          description,
          senderAccountId,
          receiverAccountId,
          senderNewBalance: newSenderBalance,
          createdAt:        transactionRecord.createdAt,
        },
      },
    });
  } catch (err) {
    // Rollback if transaction still open
    try { await dbTransaction.rollback(); } catch (_) {}

    // Record as failed
    try {
      if (!transactionRecord) {
        await Transaction.create({
          senderId:          req.user?.id || 'unknown',
          receiverId:        req.body?.receiverAccountId || 'unknown',
          senderAccountId:   req.body?.senderAccountId  || 'unknown',
          receiverAccountId: req.body?.receiverAccountId || 'unknown',
          amount:            parseFloat(req.body?.amount) || 0,
          status:            'FAILED',
          description:       req.body?.description,
          failureReason:     err.message,
        });
      }
    } catch (_) {}

    next(err);
  }
}

// ─── 4.2 Get Transactions List by User ────────────────────────────────────────
async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const offset = (page - 1) * limit;
    const status = req.query.status; // optional filter: SUCCESS | FAILED | PENDING

    const { Op } = require('sequelize');

    const where = {
      [Op.or]: [{ senderId: userId }, { receiverId: userId }],
    };
    if (status && ['SUCCESS', 'FAILED', 'PENDING'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Annotate each transaction with direction from the calling user's perspective
    const transactions = rows.map((t) => ({
      id:               t.id,
      referenceId:      t.referenceId,
      amount:           parseFloat(t.amount).toFixed(2),
      currency:         t.currency,
      status:           t.status,
      description:      t.description,
      failureReason:    t.failureReason,
      direction:        t.senderId === userId ? 'DEBIT' : 'CREDIT',
      senderAccountId:  t.senderAccountId,
      receiverAccountId:t.receiverAccountId,
      senderId:         t.senderId,
      receiverId:       t.receiverId,
      createdAt:        t.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total:      count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { doPayment, getTransactions };
