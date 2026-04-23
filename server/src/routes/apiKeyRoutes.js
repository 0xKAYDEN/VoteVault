import express from 'express';
import { getApiKeys, createApiKey, revokeApiKey } from '../controllers/apiKeyController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getApiKeys);
router.post('/', auth, createApiKey);
router.post('/:id/revoke', auth, revokeApiKey);

export default router;
