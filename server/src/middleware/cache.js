import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

// Cache middleware - caches GET requests
export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await cache.get(key);

      if (cachedData) {
        logger.info(`Cache HIT: ${key}`);
        return res.json(cachedData);
      }

      logger.info(`Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        cache.set(key, data, ttl).catch(err => {
          logger.error('Failed to cache response:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (err) {
      logger.error('Cache middleware error:', err);
      next();
    }
  };
};

// Invalidate cache by pattern
export const invalidateCache = async (pattern) => {
  try {
    await cache.delPattern(pattern);
    logger.info(`Cache invalidated: ${pattern}`);
  } catch (err) {
    logger.error('Cache invalidation error:', err);
  }
};

// Invalidate specific cache key
export const invalidateCacheKey = async (key) => {
  try {
    await cache.del(key);
    logger.info(`Cache key invalidated: ${key}`);
  } catch (err) {
    logger.error('Cache key invalidation error:', err);
  }
};
