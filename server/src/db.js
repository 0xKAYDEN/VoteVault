import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from server/src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isDev = process.env.NODE_ENV !== 'production';

if (!process.env.DB_USER) {
  // Already caught by index.js in production; log here for standalone db.js usage
  logger.error('DB_USER is not defined — check your .env file');
}

// Enhanced connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Connection pool settings
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  maxIdle: parseInt(process.env.DB_MAX_IDLE) || 10,
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000, // 60 seconds
  queueLimit: 0, // Unlimited queue

  // Keep-alive settings
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds

  // Connection timeout settings
  connectTimeout: 60000, // 60 seconds to establish connection
  acquireTimeout: 60000, // 60 seconds to acquire connection from pool
  timeout: 60000, // 60 seconds for query execution

  // Charset and timezone — use local system timezone to match MySQL's NOW()
  charset: 'utf8mb4',

  // Additional MySQL settings
  multipleStatements: false, // Security: prevent SQL injection
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,

  // Reconnection settings
  reconnect: true,
};

const pool = mysql.createPool(poolConfig);

// Connection health check interval
let healthCheckInterval;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Test the connection with retry logic
async function testConnection(attempt = 1) {
  if (isDev) logger.info(`DB: connecting (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`);

  try {
    const connection = await pool.getConnection();
    // Only log non-sensitive confirmation — no host/db values in production
    if (isDev) {
      logger.info(`DB: connected — host=${process.env.DB_HOST} db=${process.env.DB_NAME} pool=${poolConfig.connectionLimit}`);
    } else {
      logger.info('DB: connected');
    }
    connection.release();
    connectionAttempts = 0;
    startHealthCheck();
    return true;
  } catch (err) {
    logger.error(`DB: connection failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}): ${err.message} [${err.code}]`);

    if (attempt < MAX_RETRY_ATTEMPTS) {
      if (isDev) logger.info(`DB: retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return testConnection(attempt + 1);
    } else {
      logger.error('DB: max retry attempts reached — check DB config and ensure MySQL is running');
      return false;
    }
  }
}

// Health check function
async function healthCheck() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    if (connectionAttempts > 0) {
      logger.info('DB: connection restored');
      connectionAttempts = 0;
    }
  } catch (err) {
    connectionAttempts++;
    logger.error(`DB: health check failed (${connectionAttempts}): ${err.message}`);
    if (connectionAttempts >= 3) {
      logger.error('DB: multiple health check failures — connection may be lost');
    }
  }
}

// Start periodic health checks
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  // Check connection health every 30 seconds
  healthCheckInterval = setInterval(healthCheck, 30000);
}

// Stop health checks (for graceful shutdown)
function stopHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

// Handle pool errors
pool.on('error', (err) => {
  const msgs = {
    PROTOCOL_CONNECTION_LOST: 'connection was closed — pool will reconnect automatically',
    ER_CON_COUNT_ERROR:        'too many connections — consider increasing max_connections',
    ECONNREFUSED:              'connection refused — check if MySQL is running',
    ETIMEDOUT:                 'connection timed out — check network connectivity',
    ER_ACCESS_DENIED_ERROR:    'access denied — check database credentials',
  };
  const detail = msgs[err.code] || err.message;
  logger.error(`DB pool error [${err.code}]: ${detail}`);
  if (['PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED', 'ETIMEDOUT'].includes(err.code)) {
    connectionAttempts++;
  }
});

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('DB: shutting down connection pool...');
  stopHealthCheck();
  try {
    await pool.end();
    logger.info('DB: connection pool closed');
  } catch (err) {
    logger.error(`DB: error closing pool: ${err.message}`);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

// Initialize connection
testConnection();

// Export pool and utility functions
export default pool;

export {
  testConnection,
  healthCheck,
  gracefulShutdown,
  stopHealthCheck,
};
