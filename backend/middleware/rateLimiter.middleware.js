const { incrementWithExpiry } = require('../services/redis.service');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/response');

/**
 * Rate limiter based on user plan and API key
 */
const rateLimiter = async (req, res, next) => {
  const { apiKey, apiOwner } = req;

  try {
    // Get user to check plan
    const user = await User.findById(apiOwner);
    const plan = user ? user.plan : 'free';
    
    // ✅ SECURITY FIX: Changed from per-minute to per-hour limits aligned with monthly billing
    // Free: 10K/month (~333/day) = 14 requests/hour
    // Pro: 100K/month (~3333/day) = 139 requests/hour
    const limit = plan === 'pro' ? 139 : 14;  // Per hour
    const windowSeconds = 3600; // 1 hour
    
    // Create a key for the current hour
    const currentHour = Math.floor(Date.now() / 3600000);
    const redisKey = `ratelimit:${apiKey._id}:${currentHour}`;

    const count = await incrementWithExpiry(redisKey, windowSeconds);

    // Set Rate Limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
    res.setHeader('X-RateLimit-Reset', windowSeconds);

    if (count > limit) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: windowSeconds,
      });
    }

    next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // On redis error, allow request but log it (fail-open)
    next();
  }
};

module.exports = rateLimiter;
