import express from 'express';
import db from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Batch endpoint - Get multiple resources in one request
 * POST /api/batch
 * Body: { requests: [{ endpoint: '/servers', method: 'GET' }, ...] }
 */
router.post('/', async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Invalid batch request format' });
    }

    if (requests.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 requests per batch' });
    }

    logger.info(`📦 Batch request: ${requests.length} endpoints`);

    const results = await Promise.allSettled(
      requests.map(async (request) => {
        const { endpoint } = request;

        // Handle /servers endpoint
        if (endpoint === '/servers' || endpoint.startsWith('/servers?')) {
          const [rows] = await db.query(`
            SELECT
              s.*,
              COALESCE(v.vote_count, 0) as vote_count,
              COALESCE(r.rating_avg, 0) as rating_avg,
              COALESCE(r.rating_count, 0) as rating_count
            FROM servers s
            LEFT JOIN (
              SELECT server_id, COUNT(*) as vote_count
              FROM votes
              GROUP BY server_id
            ) v ON s.id = v.server_id
            LEFT JOIN (
              SELECT server_id, AVG(rating) as rating_avg, COUNT(*) as rating_count
              FROM reviews
              GROUP BY server_id
            ) r ON s.id = r.server_id
            WHERE s.status = 'approved'
            ORDER BY vote_count DESC
          `);
          return rows;
        }

        // Handle /stats/site endpoint
        if (endpoint === '/stats/site') {
          const [result] = await db.query('SELECT SUM(visits) as total_visits FROM site_stats');
          return { total_visits: result[0]?.total_visits || 0 };
        }

        throw new Error(`Endpoint ${endpoint} not supported in batch`);
      })
    );

    // Format response
    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          endpoint: requests[index].endpoint,
          status: 200,
          data: result.value
        };
      } else {
        return {
          endpoint: requests[index].endpoint,
          status: 500,
          error: result.reason.message
        };
      }
    });

    res.json({ results: response });
  } catch (error) {
    logger.error('Batch request error:', error);
    res.status(500).json({ error: 'Batch request failed' });
  }
});

export default router;
