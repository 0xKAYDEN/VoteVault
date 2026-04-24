import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

/**
 * Redis-based rate limiter middleware
 * More efficient than express-rate-limit for distributed systems
 */
export const rateLimitRedis = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    keyPrefix = 'ratelimit',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler = null
  } = options;

  return async (req, res, next) => {
    try {
      // Create unique key based on IP
      const identifier = req.ip || req.connection.remoteAddress;
      const key = `${keyPrefix}:${identifier}`;

      // Get current count
      const current = await cache.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= max) {
        logger.warn(`Rate limit exceeded for ${identifier}`);

        if (handler) {
          return handler(req, res);
        }

        return res.status(429).json({
          error: 'Too many requests, please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Increment counter
      const newCount = count + 1;
      const ttl = count === 0 ? Math.ceil(windowMs / 1000) : await cache.ttl(key);
      await cache.set(key, newCount, ttl > 0 ? ttl : Math.ceil(windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - newCount));
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      // Store original end function
      const originalEnd = res.end;

      // Override end to handle skipSuccessfulRequests/skipFailedRequests
      res.end = function(...args) {
        const statusCode = res.statusCode;
        const shouldSkip =
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip) {
          // Decrement counter if we should skip this request
          cache.get(key).then(val => {
            if (val) {
              const decremented = Math.max(0, parseInt(val) - 1);
              cache.set(key, decremented, ttl > 0 ? ttl : Math.ceil(windowMs / 1000));
            }
          });
        }

        return originalEnd.apply(res, args);
      };

      next();
    } catch (err) {
      logger.error('Rate limit middleware error:', err);
      // On error, allow the request through
      next();
    }
  };
};

/**
 * Strict rate limiter for sensitive endpoints (login, register, etc.)
 */
export const strictRateLimit = rateLimitRedis({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  keyPrefix: 'ratelimit:strict',
  skipSuccessfulRequests: false
});

/**
 * Vote rate limiter - prevents spam voting attempts
 */
export const voteRateLimit = rateLimitRedis({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 vote attempts per minute
  keyPrefix: 'ratelimit:vote',
  skipFailedRequests: true // Don't count failed votes
});

/**
 * API rate limiter - general API protection
 */
export const apiRateLimit = rateLimitRedis({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  keyPrefix: 'ratelimit:api'
});

/**
 * Payment rate limiter - prevent payment spam
 */
export const paymentRateLimit = rateLimitRedis({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 payment submissions per hour
  keyPrefix: 'ratelimit:payment'
});
