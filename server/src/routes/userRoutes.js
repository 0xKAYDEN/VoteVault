import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { cacheMiddleware } from '../middleware/cache.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:userId', cacheMiddleware(300), getUserProfile); // Cache for 5 minutes

// Protected routes
router.put('/profile', auth, updateUserProfile);

export default router;
