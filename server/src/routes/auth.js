const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  logout,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { authRateLimit } = require('../middleware/auth');

// Public routes
router.post('/register', authRateLimit, validate(schemas.register), register);
router.post('/login', authRateLimit, validate(schemas.login), login);
router.post('/refresh', refresh);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;
