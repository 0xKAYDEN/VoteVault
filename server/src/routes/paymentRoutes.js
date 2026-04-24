import express from 'express';
import authenticate from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import {
  verifyPayment,
  getUserPayments,
  getActiveSubscription,
  activatePayment,
  rejectPayment,
  getPendingPayments
} from '../controllers/paymentController.js';

const router = express.Router();

// User routes
router.post('/verify', authenticate, verifyPayment);
router.get('/my-payments', authenticate, getUserPayments);
router.get('/subscription', authenticate, getActiveSubscription);

// Admin routes
router.get('/pending', authenticate, adminOnly, getPendingPayments);
router.post('/:paymentId/activate', authenticate, adminOnly, activatePayment);
router.post('/:paymentId/reject', authenticate, adminOnly, rejectPayment);

export default router;
