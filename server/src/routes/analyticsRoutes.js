import express from 'express';
import auth from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';
import {
  getRealtimeStats,
  getTrends,
  getGeoDistribution,
  getPeakTimes,
  getReferrers,
  getDemographics,
} from '../controllers/analyticsController.js';

const router = express.Router();

// Realtime stats - short cache (30s)
router.get('/realtime', auth, cacheMiddleware(30), getRealtimeStats);

// Historical trends - medium cache (5 min)
router.get('/trends', auth, cacheMiddleware(300), getTrends);

// Geographic distribution - medium cache (5 min)
router.get('/geo', auth, cacheMiddleware(300), getGeoDistribution);

// Peak voting times - medium cache (5 min)
router.get('/peak-times', auth, cacheMiddleware(300), getPeakTimes);

// Referrer / attribution - medium cache (5 min)
router.get('/referrers', auth, cacheMiddleware(300), getReferrers);

// Player demographics - medium cache (5 min)
router.get('/demographics', auth, cacheMiddleware(300), getDemographics);

export default router;
