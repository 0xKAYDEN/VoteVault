import express from 'express';
import {
  register, login, getMe, updateProfile,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
  updateEmail, updatePassword, googleLogin, logout
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';
import { rateLimitRedis } from '../middleware/rateLimit.js';

const router = express.Router();

const authLimiter     = rateLimitRedis({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'rl:auth' });
const passwordLimiter = rateLimitRedis({ windowMs: 60 * 60 * 1000, max: 5,  keyPrefix: 'rl:pwd'  });

router.post('/register', authLimiter, validate(registerSchema), verifyRecaptcha, register);
router.post('/login', authLimiter, validate(loginSchema), verifyRecaptcha, login);
router.post('/logout', logout);
router.post('/google-login', authLimiter, googleLogin);
router.get('/me', auth, getMe);
router.put('/update-profile', auth, updateProfile);
router.put('/update-email', auth, updateEmail);
router.put('/update-password', auth, updatePassword);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', passwordLimiter, resendVerification);
router.post('/forgot-password', passwordLimiter, forgotPassword);
router.post('/reset-password', passwordLimiter, resetPassword);

export default router;
