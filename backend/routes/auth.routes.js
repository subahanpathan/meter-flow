const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redis } = require('../services/redis.service');
const {
  register,
  login,
  refresh,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiting for auth routes (stored in Redis or Memory)
const isMock = redis.constructor.name === 'RedisMock';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  store: isMock ? undefined : new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

// Stricter limiter specifically for registration to prevent abuse
const registerMaxAttempts = process.env.NODE_ENV === 'production' ? 5 : 100;
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: registerMaxAttempts,
  message: 'Too many registration attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: isMock ? undefined : new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (req, res /*, next */) => {
    return res.status(429).json({
      success: false,
      message: 'Too many registration attempts from this IP, please try again later',
    });
  },
});

// Apply general auth limiter to non-registration endpoints
router.use((req, res, next) => {
  if (req.path === '/register') return next();
  return authLimiter(req, res, next);
});

router.post(
  '/register',
  registerLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/(?=.*[A-Z])/, 'g')
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/(?=.*\d)/, 'g')
      .withMessage('Password must contain at least one number')
      .matches(/(?=.*[!@#$%^&*()_+\-=[\]{};:\"\\|,.<>/?])/)
      .withMessage('Password must contain at least one special character'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  login
);

router.post('/refresh', refresh);

router.get('/me', protect, getMe);

router.post('/logout', logout);

module.exports = router;
