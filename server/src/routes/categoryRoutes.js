import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import auth from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Public routes with caching
router.get('/', cacheMiddleware(600), categoryController.getAllCategories); // Cache for 10 minutes
router.get('/:slug', cacheMiddleware(600), categoryController.getCategoryBySlug);
router.get('/:slug/servers', cacheMiddleware(300), categoryController.getServersByCategory); // Cache for 5 minutes
router.get('/server/:serverId', cacheMiddleware(300), categoryController.getServerCategories);

// Protected routes (require authentication)
router.post('/server/:serverId', auth, categoryController.addCategoryToServer);
router.delete('/server/:serverId/:categoryId', auth, categoryController.removeCategoryFromServer);

export default router;
