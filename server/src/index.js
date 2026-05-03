// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from server/src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate critical env vars at startup — fail fast in production, warn in dev
const REQUIRED_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const isDev = process.env.NODE_ENV !== 'production';

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  // In production, crash immediately — a misconfigured server should not start
  const msg = `Missing required environment variables: ${missing.join(', ')}`;
  if (!isDev) {
    process.stderr.write(`[FATAL] ${msg}\n`);
    process.exit(1);
  } else {
    process.stderr.write(`[WARN]  ${msg}\n`);
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import logger from './utils/logger.js';
import { trackVisit } from './middleware/statsMiddleware.js';
import { initializeSocket } from './socket.js';
import authRoutes from './routes/authRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendsRoutes from './routes/friendsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import twoFactorRoutes from './routes/twoFactorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userExperienceRoutes from './routes/userExperienceRoutes.js';
import serverEnhancementRoutes from './routes/serverEnhancementRoutes.js';
import serverOwnerRoutes from './routes/serverOwnerRoutes.js';
import userPreferencesRoutes from './routes/userPreferencesRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import premiumRoutes from './routes/premiumRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import publicApiRoutes from './routes/publicApiRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import messageRequestRoutes from './routes/messageRequestRoutes.js';
import groupChatRoutes from './routes/groupChatRoutes.js';
import { startScheduler } from './utils/scheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`→ ${req.method} ${req.url} - IP: ${req.ip}`);

  // Only log request bodies in development — never in production
  if (isDev && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password)       sanitizedBody.password       = '[REDACTED]';
    if (sanitizedBody.recaptchaToken) sanitizedBody.recaptchaToken = '[REDACTED]';
    if (sanitizedBody.txHash)         sanitizedBody.txHash         = '[REDACTED]';
    logger.info(`  Body: ${JSON.stringify(sanitizedBody)}`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`← ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// Must be registered before all other middleware so preflight responses
// are handled correctly.

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean)
);

/**
 * Decide whether an origin is allowed.
 * Requests with no Origin header (server-to-server, curl, Postman) are always
 * permitted — they are not subject to the browser Same-Origin Policy.
 */
function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);          // no-origin → allow
  if (allowedOrigins.has(origin)) return callback(null, true);

  // Log the blocked origin (origin value is safe to log — it comes from the
  // request header, not from our config).
  logger.warn(`CORS blocked origin: ${origin}`);

  // Pass an Error so the cors package returns a 403 with a JSON body instead
  // of silently omitting the CORS headers (which gives the browser a useless
  // "Network Error" with no status code).
  const err = new Error('Origin not allowed by CORS policy');
  err.status = 403;
  callback(err);
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,           // cache preflight for 24 h
  optionsSuccessStatus: 204,
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Explicit preflight handler — must come after app.use(cors()) so the CORS
// headers are already set when we send the 204, but before any route handler
// that might accidentally respond to OPTIONS.
app.options('*', cors(corsOptions));

// Custom error handler for CORS rejections — converts the Error thrown by
// corsOrigin() into a consistent JSON 403 response.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status === 403 && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This origin is not permitted to access this API.',
    });
  }
  next(err);
});

// Logging Middleware
app.use(morgan('short', { stream: { write: message => logger.info(message.trim()) } }));

// Security Middleware - AFTER CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false
}));

// FIX #15: Tighten global rate limit to a sensible value
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  skip: (req) => {
    // Skip rate limiting for health checks and localhost in development
    if (req.path === '/health' || req.path === '/api/health') return true;
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || '';
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

app.use(express.json());

// Parse cookies — required for HttpOnly auth_token cookie
app.use(cookieParser());

// Global stats tracking
app.use(trackVisit);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/batch', batchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-experience', userExperienceRoutes);
app.use('/api/server-enhancements', serverEnhancementRoutes);
app.use('/api/server-owner', serverOwnerRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/v1', publicApiRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/message-requests', messageRequestRoutes);
app.use('/api/groups', groupChatRoutes);
app.use('/api', healthRoutes);

// Basic health check (legacy endpoint)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VoteVault Backend is running' });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  logger.error(`❌ ERROR: ${err.status || 500} - ${err.message}`);
  logger.error(`   URL: ${req.originalUrl}`);
  logger.error(`   Method: ${req.method}`);
  logger.error(`   IP: ${req.ip}`);
  logger.error(`   Stack: ${err.stack}`);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: status
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🔥 Unhandled Promise Rejection:', reason);
  logger.error('   Promise:', promise);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  logger.error('   Stack:', error.stack);
  // Don't exit the process, just log it
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const httpServer = createServer(app);

  // Initialize Socket.io
  logger.info('🔌 Initializing Socket.io...');
  initializeSocket(httpServer);

  httpServer.listen(PORT, async () => {
    logger.info('='.repeat(50));
    logger.info(`🚀 VoteVault Server Started`);
    logger.info(`   Port: ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Time: ${new Date().toISOString()}`);
    logger.info('='.repeat(50));

    // Auto-create app_settings table if it doesn't exist
    try {
      const pool = (await import('./db.js')).default;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          setting_key  VARCHAR(100) NOT NULL UNIQUE,
          setting_value TEXT        NOT NULL DEFAULT '',
          updated_by   VARCHAR(36)  NULL,
          updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.query(
        `INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('payments_enabled', 'true')`
      );
    } catch (e) {
      logger.warn('Could not auto-create app_settings table:', e.message);
    }

    // Fix reports table ENUMs to include all valid values
    try {
      const pool = (await import('./db.js')).default;
      await pool.query(`
        ALTER TABLE reports
          MODIFY COLUMN reported_type ENUM('user', 'server', 'review', 'thread') NOT NULL,
          MODIFY COLUMN reason ENUM('spam', 'harassment', 'inappropriate', 'cheating', 'fake', 'vote_manipulation', 'other') NOT NULL
      `);
    } catch (e) {
      // Silently ignore — table may not exist yet or already correct
    }

    // Create favorites and message_requests tables
    try {
      const pool = (await import('./db.js')).default;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS server_favorites (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id CHAR(36) NOT NULL,
          server_id BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_favorite (user_id, server_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS message_requests (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          sender_id CHAR(36) NOT NULL,
          receiver_id CHAR(36) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_request (sender_id, receiver_id),
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (e) {
      logger.warn('Could not create favorites/message_requests tables:', e.message);
    }

    // Create group chat tables
    try {
      const pool = (await import('./db.js')).default;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS group_chats (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_by CHAR(36) NOT NULL,
          avatar_url VARCHAR(500) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS group_chat_members (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          group_id BIGINT UNSIGNED NOT NULL,
          user_id CHAR(36) NOT NULL,
          role ENUM('admin','member') NOT NULL DEFAULT 'member',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_member (group_id, user_id),
          FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS group_messages (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          group_id BIGINT UNSIGNED NOT NULL,
          sender_id CHAR(36) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (e) {
      logger.warn('Could not create group chat tables:', e.message);
    }

    startScheduler();
  });

  httpServer.on('error', (error) => {
    logger.error('❌ Server error:', error);
  });
}
