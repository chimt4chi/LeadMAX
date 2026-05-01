const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');

// ─── Token Helpers ────────────────────────────────────────────────────────────
function generateAccessToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '5m' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d' }
  );
}

function getRefreshTokenExpiry() {
  // 1 day from now
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

// ─── 2.1 Login User ───────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Include password for comparison
    const user = await User.scope('withPassword').findOne({ where: { email, isActive: true } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Persist refresh token
    await RefreshToken.create({
      userId:    user.id,
      token:     refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 300, // 5 minutes in seconds
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── 2.2 Refresh Token ────────────────────────────────────────────────────────
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Refresh token has expired. Please log in again.', code: 'REFRESH_TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'REFRESH_TOKEN_INVALID' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Check DB record
    const storedToken = await RefreshToken.findOne({
      where: { token, userId: decoded.userId, isRevoked: false },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token is invalid or expired' });
    }

    // Ensure user still active
    const user = await User.findOne({ where: { id: decoded.userId, isActive: true } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    // Rotate: revoke old token, issue new pair
    await storedToken.update({ isRevoked: true });

    const newAccessToken  = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await RefreshToken.create({
      userId:    user.id,
      token:     newRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken:  newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 300,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Logout (bonus – revoke refresh token) ───────────────────────────────────
async function logout(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await RefreshToken.update({ isRevoked: true }, { where: { token } });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refreshToken, logout };
