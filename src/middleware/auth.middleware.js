const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware: Verify Access Token
 * Protects routes by validating the Bearer token in the Authorization header.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing or malformed. Use "Bearer <token>"',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch fresh user to ensure account is still active
    const user = await User.findOne({ where: { id: decoded.userId, isActive: true } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account is deactivated',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'TOKEN_INVALID',
      });
    }
    next(err);
  }
}

module.exports = { authenticate };
