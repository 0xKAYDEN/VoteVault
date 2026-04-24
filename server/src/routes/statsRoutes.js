import express from 'express';
import { getTotalVisits, getStatsByDateRange } from '../controllers/statsController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Public routes with caching
router.get('/total-visits', cacheMiddleware(300), getTotalVisits); // Cache for 5 minutes
router.get('/date-range', cacheMiddleware(300), getStatsByDateRange);

export default router;
