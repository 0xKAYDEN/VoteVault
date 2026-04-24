import express from 'express';
import { getUserProfile } from '../controllers/userController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Public routes
router.get('/:userId', cacheMiddleware(300), getUserProfile); // Cache for 5 minutes

export default router;
