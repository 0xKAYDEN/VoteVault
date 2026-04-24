import express from 'express';
import {
  register, login, getMe, updateProfile,
  verifyEmail, forgotPassword, resetPassword,
  updateEmail, updatePassword, googleLogin
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';

const router = express.Router();

router.post('/register', validate(registerSchema), verifyRecaptcha, register);
router.post('/login', validate(loginSchema), verifyRecaptcha, login);
router.post('/google-login', googleLogin);
router.get('/me', auth, getMe);
router.put('/update-profile', auth, updateProfile);
router.put('/update-email', auth, updateEmail);
router.put('/update-password', auth, updatePassword);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
