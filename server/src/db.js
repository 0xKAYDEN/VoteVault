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

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Remove invalid options for mysql2
  maxIdle: 10,
  idleTimeout: 60000, // 60 seconds
});

// Test the connection
console.log('🔄 Testing database connection...');
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:');
    console.error('   Error:', err.message);
    console.error('   Code:', err.code);
    console.error('   Stack:', err.stack);
  });

// Handle connection errors gracefully without crashing
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Pool will reconnect automatically.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

export default pool;
