import pool from '../db.js';
import logger from '../utils/logger.js';

/**
 * Database Connection Middleware
 * Ensures database connection is healthy before processing requests
 */
export const checkDatabaseConnection = async (req, res, next) => {
  try {
    // Quick connection check
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    next();
  } catch (err) {
    logger.error('Database connection check failed:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection is currently unavailable. Please try again later.',
    });
  }
};

/**
 * Query Wrapper with Automatic Retry
 * Wraps database queries with retry logic for transient failures
 */
export async function queryWithRetry(queryFn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (err) {
      lastError = err;

      // Check if error is retryable
      const isRetryable = [
        'PROTOCOL_CONNECTION_LOST',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ER_LOCK_DEADLOCK',
        'ER_LOCK_WAIT_TIMEOUT',
      ].includes(err.code);

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      logger.warn(`Query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, {
        error: err.message,
        code: err.code,
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay *= 2;
    }
  }

  throw lastError;
}

/**
 * Transaction Wrapper with Automatic Rollback
 * Safely executes transactions with automatic rollback on error
 */
export async function executeTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    logger.error('Transaction rolled back:', err);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Connection Pool Status
 * Returns current pool statistics
 */
export function getPoolStatus() {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length,
  };
}

/**
 * Health Check Endpoint Handler
 * Provides detailed database health information
 */
export async function getDatabaseHealth() {
  try {
    const connection = await pool.getConnection();
    const startTime = Date.now();

    // Test query
    await connection.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    // Get pool status
    const poolStatus = getPoolStatus();

    // Get MySQL status
    const [statusRows] = await connection.query('SHOW STATUS LIKE "Threads_connected"');
    const threadsConnected = statusRows[0]?.Value || 0;

    connection.release();

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      pool: poolStatus,
      mysql: {
        threadsConnected: parseInt(threadsConnected),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('Database health check failed:', err);
    return {
      status: 'unhealthy',
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    };
  }
}

export default {
  checkDatabaseConnection,
  queryWithRetry,
  executeTransaction,
  getPoolStatus,
  getDatabaseHealth,
};
