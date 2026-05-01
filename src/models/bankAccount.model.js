const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * BankAccount Model
 * Each user can have up to 3 bank accounts with their own balance.
 */
const BankAccount = sequelize.define('BankAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: { msg: 'Account number already exists' },
    validate: {
      notEmpty: { msg: 'Account number cannot be empty' },
      len: { args: [5, 30], msg: 'Account number must be 5–30 characters' },
    },
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Bank name cannot be empty' },
    },
  },
  accountHolderName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Account holder name cannot be empty' },
    },
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Balance cannot be negative' },
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'bank_accounts',
  timestamps: true,
});

module.exports = BankAccount;
