const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

/**
 * Protect routes — require valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Not authorized. Please log in.', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User no longer exists.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated.', 401);
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Please log in again.', 401);
    }
    return errorResponse(res, 'Authorization failed.', 401);
  }
};

/**
 * Require house membership
 */
const requireHouse = (req, res, next) => {
  if (!req.user.house) {
    return errorResponse(res, 'You must be in a house to perform this action.', 403);
  }
  next();
};

/**
 * Require house admin role
 */
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Only house admins can perform this action.', 403);
  }
  next();
};

/**
 * Rate limiting helper (used in specific routes)
 */
const createRateLimit = require('express-rate-limit');

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Too many requests. Slow down!' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { protect, requireHouse, requireAdmin, authRateLimit, generalRateLimit };
