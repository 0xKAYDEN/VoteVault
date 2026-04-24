import express from 'express';
import { getServers } from '../controllers/serverController.js';
import { getSiteStats } from '../controllers/statsController.js';
import { cacheMiddleware } from '../middleware/cache.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Batch endpoint - Get multiple resources in one request
 * POST /api/batch
 * Body: { requests: [{ endpoint: '/servers', method: 'GET' }, ...] }
 */
router.post('/', cacheMiddleware(300), async (req, res) => {
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
        const { endpoint, method = 'GET' } = request;

        // Only allow GET requests in batch
        if (method !== 'GET') {
          throw new Error('Only GET requests allowed in batch');
        }

        // Route to appropriate controller
        if (endpoint === '/servers' || endpoint.startsWith('/servers?')) {
          const mockReq = { query: {} };
          const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ status: code, data }) })
          };
          return await getServers(mockReq, mockRes);
        }

        if (endpoint === '/stats/site') {
          const mockReq = {};
          const mockRes = {
            json: (data) => data,
            status: (code) => ({ json: (data) => ({ status: code, data }) })
          };
          return await getSiteStats(mockReq, mockRes);
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
