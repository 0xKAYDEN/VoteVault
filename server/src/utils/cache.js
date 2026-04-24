import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Too many reconnection attempts, giving up');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
  }
})();

// Cache helper functions
export const cache = {
  // Get cached data
  get: async (key) => {
    try {
      if (!redisClient.isOpen) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  },

  // Set cache with TTL (time to live in seconds)
  set: async (key, value, ttl = 300) => {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      logger.error(`Cache set error for key ${key}:`, err);
      return false;
    }
  },

  // Delete cache key
  del: async (key) => {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.error(`Cache delete error for key ${key}:`, err);
      return false;
    }
  },

  // Delete multiple keys by pattern
  delPattern: async (pattern) => {
    try {
      if (!redisClient.isOpen) return false;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (err) {
      logger.error(`Cache delete pattern error for ${pattern}:`, err);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      if (!redisClient.isOpen) return false;
      return await redisClient.exists(key) === 1;
    } catch (err) {
      logger.error(`Cache exists error for key ${key}:`, err);
      return false;
    }
  },

  // Get TTL for a key
  ttl: async (key) => {
    try {
      if (!redisClient.isOpen) return -1;
      return await redisClient.ttl(key);
    } catch (err) {
      logger.error(`Cache TTL error for key ${key}:`, err);
      return -1;
    }
  }
};

export default redisClient;
