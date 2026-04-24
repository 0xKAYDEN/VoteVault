import express from 'express';
import auth from '../middleware/auth.js';
import {
  claimServerOwnership,
  getUserClaims,
  getServerAnalytics,
  editServerDetails,
  getOwnerDashboardStats,
  updateActivePlayers
} from '../controllers/serverOwnerController.js';

const router = express.Router();

// Ownership claims
router.post('/claim', auth, claimServerOwnership);
router.get('/claims', auth, getUserClaims);

// Server management
router.put('/:serverId/edit', auth, editServerDetails);
router.get('/:serverId/analytics', auth, getServerAnalytics);
router.post('/:serverId/active-players', auth, updateActivePlayers);

// Dashboard
router.get('/dashboard/stats', auth, getOwnerDashboardStats);

export default router;
