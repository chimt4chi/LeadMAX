const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const {
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  getUsersList,
} = require('../controllers/user.controller');
const {
  createUserValidation,
  updateUserValidation,
  userIdParamValidation,
  getUsersListValidation,
} = require('../validators/user.validators');

/**
 * @route   POST /api/v1/users
 * @desc    1.1 Create User
 * @access  Public
 */
router.post('/', createUserValidation, validate, createUser);

/**
 * @route   GET /api/v1/users
 * @desc    1.5 Get Users List (paginated, searchable)
 * @access  Private
 */
router.get('/', authenticate, getUsersListValidation, validate, getUsersList);

/**
 * @route   GET /api/v1/users/:id
 * @desc    1.4 Get User Profile
 * @access  Private
 */
router.get('/:id', authenticate, userIdParamValidation, validate, getUserProfile);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    1.2 Update User
 * @access  Private
 */
router.put('/:id', authenticate, updateUserValidation, validate, updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    1.3 Delete User
 * @access  Private
 */
router.delete('/:id', authenticate, userIdParamValidation, validate, deleteUser);

module.exports = router;
