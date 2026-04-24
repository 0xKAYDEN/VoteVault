import express from 'express';
import * as twoFactorController from '../controllers/twoFactorController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/status', auth, twoFactorController.get2FAStatus);
router.post('/generate', auth, twoFactorController.generate2FASecret);
router.post('/enable', auth, twoFactorController.enable2FA);
router.post('/disable', auth, twoFactorController.disable2FA);
router.post('/verify', twoFactorController.verify2FAToken); // Public for login

export default router;
