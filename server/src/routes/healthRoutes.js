import express from 'express';
import { getDatabaseHealth } from '../middleware/database.js';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint for monitoring
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getDatabaseHealth();

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/db
 * Detailed database health check
 */
router.get('/health/db', async (req, res) => {
  try {
    const health = await getDatabaseHealth();
    res.json(health);
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: err.message,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/health/ready', async (req, res) => {
  try {
    const health = await getDatabaseHealth();

    if (health.status === 'healthy') {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: health.error });
    }
  } catch (err) {
    res.status(503).json({ ready: false, reason: err.message });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/health/live', (req, res) => {
  // Simple liveness check - server is running
  res.status(200).json({ alive: true });
});

export default router;
