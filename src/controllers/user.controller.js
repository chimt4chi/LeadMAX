const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/user.model');
const BankAccount = require('../models/bankAccount.model');
const Transaction = require('../models/transaction.model');
const RefreshToken = require('../models/refreshToken.model');

// ─── Helper ──────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;

const userPublicFields = ['id', 'name', 'email', 'phone', 'isActive', 'createdAt', 'updatedAt'];

// ─── 1.1 Create User ─────────────────────────────────────────────────────────
async function createUser(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ name, email, phone, password: hashedPassword });

    // Reload without password
    const created = await User.findByPk(user.id, { attributes: userPublicFields });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: created },
    });
  } catch (err) {
    // Sequelize unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }
    next(err);
  }
}

// ─── 1.2 Update User ─────────────────────────────────────────────────────────
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { id, isActive: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (name)     updates.name  = name;
    if (phone)    updates.phone = phone;
    if (password) updates.password = await bcrypt.hash(password, SALT_ROUNDS);

    await user.update(updates);

    const updated = await User.findByPk(id, { attributes: userPublicFields });

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 1.3 Delete User ─────────────────────────────────────────────────────────
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, isActive: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft-delete: deactivate instead of hard delete
    await user.update({ isActive: false });

    // Revoke all refresh tokens
    await RefreshToken.update({ isRevoked: true }, { where: { userId: id } });

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ─── 1.4 Get User Profile ─────────────────────────────────────────────────────
async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { id, isActive: true },
      attributes: userPublicFields,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 1.5 Get Users List ───────────────────────────────────────────────────────
async function getUsersList(req, res, next) {
  try {
    const page  = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = { isActive: true };
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: userPublicFields,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
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

module.exports = { createUser, updateUser, deleteUser, getUserProfile, getUsersList };
