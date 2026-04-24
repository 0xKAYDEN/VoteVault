import express from 'express';
import {
  getServers, getServerBySlug, getServerById, createServer,
  updateServer, deleteServer, incrementVisits,
  getDashboardStats, getMyServers
} from '../controllers/serverController.js';
import auth from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createServerSchema, updateServerSchema } from '../schemas/serverSchemas.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

router.get('/', cacheMiddleware(300), getServers); // Cache for 5 minutes
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/dashboard/my', auth, getMyServers);
router.get('/id/:id', cacheMiddleware(300), getServerById);
router.get('/:slug', cacheMiddleware(300), getServerBySlug);
router.post('/', auth, validate(createServerSchema), createServer);
router.put('/:id', auth, validate(updateServerSchema), updateServer);
router.delete('/:id', auth, deleteServer);
router.post('/:id/visit', incrementVisits);

export default router;

