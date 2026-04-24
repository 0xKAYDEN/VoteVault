import express from 'express';
import {
  getAllServers, updateServerStatus, verifyServer,
  getAllUsers, updateUserRole, getAdminStats,
  banUser, unbanUser, getBannedUsers,
  getReports, updateReportStatus, deleteReview
} from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

// Apply both auth and adminOnly to all routes in this file
router.use(auth);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/servers', getAllServers);
router.put('/servers/:id/status', updateServerStatus);
router.put('/servers/:id/verify', verifyServer);
router.get('/users', getAllUsers);
router.put('/users/:userId/roles', updateUserRole);
router.post('/users/ban', banUser);
router.delete('/users/:userId/ban', unbanUser);
router.get('/users/banned', getBannedUsers);
router.get('/reports', getReports);
router.put('/reports/:reportId/status', updateReportStatus);
router.delete('/reviews/:reviewId', deleteReview);

export default router;
