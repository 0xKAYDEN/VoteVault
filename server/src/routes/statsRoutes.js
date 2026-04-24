import express from 'express';
import { getTotalVisits, getStatsByDateRange, getSiteStats } from '../controllers/statsController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Public routes with caching
router.get('/site', cacheMiddleware(300), getSiteStats); // Cache for 5 minutes
router.get('/total-visits', cacheMiddleware(300), getTotalVisits); // Cache for 5 minutes
router.get('/date-range', cacheMiddleware(300), getStatsByDateRange);

export default router;
