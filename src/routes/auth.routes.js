const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { login, refreshToken, logout } = require('../controllers/auth.controller');
const { loginValidation, refreshTokenValidation } = require('../validators/auth.validators');

/**
 * @route   POST /api/v1/auth/login
 * @desc    2.1 Login User — returns Access Token + Refresh Token
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    2.2 Refresh Token — generates new Access Token (with token rotation)
 * @access  Public
 */
router.post('/refresh-token', refreshTokenValidation, validate, refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout — revokes refresh token
 * @access  Private
 */
router.post('/logout', authenticate, refreshTokenValidation, validate, logout);

module.exports = router;
