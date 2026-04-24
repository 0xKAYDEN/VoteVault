import express from 'express';
import { getAllAchievements, getUserAchievements } from '../controllers/achievementController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(3600), getAllAchievements); // Cache for 1 hour
router.get('/user/:userId', cacheMiddleware(300), getUserAchievements); // Cache for 5 minutes

export default router;
