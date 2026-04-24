// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from server/src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verify critical env vars are loaded
console.log('Environment check:');
console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('- DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('- RECAPTCHA_SECRET_KEY:', process.env.RECAPTCHA_SECRET_KEY ? 'SET' : 'NOT SET');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
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

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware - log every incoming request
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`→ ${req.method} ${req.url} - IP: ${req.ip}`);

  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.recaptchaToken) sanitizedBody.recaptchaToken = '[REDACTED]';
    logger.info(`  Body: ${JSON.stringify(sanitizedBody)}`);
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`← ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Logging Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow serving images cross-origin
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Restricted CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// CORS configuration - MUST be before other middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`CORS blocked origin: ${origin}`);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    logger.info(`CORS allowed origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight for 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());

// Global stats tracking
app.use(trackVisit);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
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

  httpServer.listen(PORT, () => {
    logger.info('='.repeat(50));
    logger.info(`🚀 VoteVault Server Started`);
    logger.info(`   Port: ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Time: ${new Date().toISOString()}`);
    logger.info('='.repeat(50));
  });

  httpServer.on('error', (error) => {
    logger.error('❌ Server error:', error);
  });
}
