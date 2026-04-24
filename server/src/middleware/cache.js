import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

// In-memory fallback cache when Redis is down
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 300000; // 5 minutes in milliseconds

// Cache middleware - caches GET requests with fallback
export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Try Redis first
      let cachedData = await cache.get(key);

      if (cachedData) {
        logger.info(`✅ Redis Cache HIT: ${key}`);
        return res.json(cachedData);
      }

      // Fallback to memory cache if Redis fails
      const memCached = memoryCache.get(key);
      if (memCached && Date.now() - memCached.timestamp < MEMORY_CACHE_TTL) {
        logger.info(`✅ Memory Cache HIT: ${key}`);
        return res.json(memCached.data);
      }

      logger.info(`❌ Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Try to cache in Redis
        cache.set(key, data, ttl).catch(err => {
          logger.error('Redis cache failed, using memory fallback:', err.message);
        });

        // Always cache in memory as fallback
        memoryCache.set(key, { data, timestamp: Date.now() });

        // Clean old memory cache entries (prevent memory leak)
        if (memoryCache.size > 1000) {
          const oldestKey = memoryCache.keys().next().value;
          memoryCache.delete(oldestKey);
        }

        return originalJson(data);
      };

      next();
    } catch (err) {
      logger.error('Cache middleware error:', err);
      next(); // Continue without cache on error
    }
  };
};

// Invalidate cache by pattern
export const invalidateCache = async (pattern) => {
  try {
    await cache.delPattern(pattern);

    // Also clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }

    logger.info(`🗑️ Cache invalidated: ${pattern}`);
  } catch (err) {
    logger.error('Cache invalidation error:', err);
  }
};

// Invalidate specific cache key
export const invalidateCacheKey = async (key) => {
  try {
    await cache.del(key);
    memoryCache.delete(key);
    logger.info(`🗑️ Cache key invalidated: ${key}`);
  } catch (err) {
    logger.error('Cache key invalidation error:', err);
  }
};
