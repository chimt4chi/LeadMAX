const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Transaction Model
 * Records every payment attempt (SUCCESS or FAILED).
 */
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  senderAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bank_accounts', key: 'id' },
  },
  receiverAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bank_accounts', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Amount must be at least 0.01' },
    },
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
    defaultValue: 'PENDING',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  referenceId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

module.exports = Transaction;
