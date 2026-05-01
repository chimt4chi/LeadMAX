const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * User Model
 * Stores core user profile and authentication credentials.
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name cannot be empty' },
      len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: { msg: 'Email is already registered' },
    validate: {
      isEmail: { msg: 'Must be a valid email address' },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: { args: /^[+]?[\d\s\-()]{7,20}$/, msg: 'Invalid phone number format' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  // Never return password in JSON output
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: { attributes: {} }, // include all
  },
});

module.exports = User;
