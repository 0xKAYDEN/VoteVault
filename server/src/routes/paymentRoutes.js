import express from 'express';
import authenticate from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import {
  verifyPayment,
  getUserPayments,
  getActiveSubscription,
  activatePayment,
  rejectPayment,
  getPendingPayments,
  grantSubscription,
  getPaymentStatus,
  setPaymentStatus,
  checkPaymentsEnabled,
} from '../controllers/paymentController.js';

const router = express.Router();

// Public — check if payments are enabled (no auth needed)
router.get('/status', checkPaymentsEnabled);

// User routes
router.post('/verify', authenticate, verifyPayment);
router.get('/my-payments', authenticate, getUserPayments);
router.get('/subscription', authenticate, getActiveSubscription);

// Admin routes
router.get('/pending', authenticate, adminOnly, getPendingPayments);
router.post('/:paymentId/activate', authenticate, adminOnly, activatePayment);
router.post('/:paymentId/reject', authenticate, adminOnly, rejectPayment);
router.post('/grant', authenticate, adminOnly, grantSubscription);
router.get('/admin/status', authenticate, adminOnly, getPaymentStatus);
router.post('/admin/status', authenticate, adminOnly, setPaymentStatus);

export default router;
