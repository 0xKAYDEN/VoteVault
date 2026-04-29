import express from 'express';
import { getApiKeys, createApiKey, revokeApiKey, getApiActivity } from '../controllers/apiKeyController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/activity', auth, getApiActivity);
router.get('/', auth, getApiKeys);
router.post('/', auth, createApiKey);
router.post('/:id/revoke', auth, revokeApiKey);

export default router;
