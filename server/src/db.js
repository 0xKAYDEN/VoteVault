import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from server/src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug: Check if env vars are loaded
console.log('='.repeat(50));
console.log('📊 Database Configuration:');
console.log('- DB_HOST:', process.env.DB_HOST || '❌ NOT SET');
console.log('- DB_USER:', process.env.DB_USER || '❌ NOT SET');
console.log('- DB_NAME:', process.env.DB_NAME || '❌ NOT SET');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('='.repeat(50));

if (!process.env.DB_USER) {
  console.error('❌ ERROR: DB_USER is not defined in environment variables!');
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

  // Charset and timezone
  charset: 'utf8mb4',
  timezone: '+00:00',

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
  console.log(`🔄 Testing database connection (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`);

  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Connection pool size: ${poolConfig.connectionLimit}`);
    connection.release();
    connectionAttempts = 0;

    // Start health check interval
    startHealthCheck();

    return true;
  } catch (err) {
    console.error(`❌ Database connection failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`);
    console.error('   Error:', err.message);
    console.error('   Code:', err.code);

    if (attempt < MAX_RETRY_ATTEMPTS) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return testConnection(attempt + 1);
    } else {
      console.error('   ❌ Max retry attempts reached. Database connection failed.');
      console.error('   Please check your database configuration and ensure MySQL is running.');
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

    // Reset connection attempts on successful health check
    if (connectionAttempts > 0) {
      console.log('✅ Database connection restored');
      connectionAttempts = 0;
    }
  } catch (err) {
    connectionAttempts++;
    console.error(`⚠️ Database health check failed (attempt ${connectionAttempts}):`, err.message);

    if (connectionAttempts >= 3) {
      console.error('❌ Multiple health check failures detected. Connection may be lost.');
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
  console.error('❌ Database pool error:', err.code, err.message);

  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('   Database connection was closed. Pool will reconnect automatically.');
    connectionAttempts++;
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('   Database has too many connections. Consider increasing max_connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('   Database connection was refused. Check if MySQL is running.');
    connectionAttempts++;
  } else if (err.code === 'ETIMEDOUT') {
    console.error('   Database connection timed out. Check network connectivity.');
    connectionAttempts++;
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('   Access denied. Check database credentials.');
  }
});

// Handle connection acquisition
pool.on('acquire', (connection) => {
  console.log('🔗 Connection %d acquired', connection.threadId);
});

// Handle connection release
pool.on('release', (connection) => {
  console.log('🔓 Connection %d released', connection.threadId);
});

// Handle connection enqueue
pool.on('enqueue', () => {
  console.log('⏳ Waiting for available connection slot');
});

// Graceful shutdown
async function gracefulShutdown() {
  console.log('🛑 Shutting down database connection pool...');
  stopHealthCheck();

  try {
    await pool.end();
    console.log('✅ Database connection pool closed successfully');
  } catch (err) {
    console.error('❌ Error closing database pool:', err.message);
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
