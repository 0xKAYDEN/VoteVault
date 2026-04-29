import express from 'express';
import {
  getAllServers, updateServerStatus, verifyServer,
  getAllUsers, updateUserRole, getAdminStats,
  banUser, unbanUser, getBannedUsers, suspendUser, awardAchievementToUser,
  getReports, updateReportStatus, deleteReview
} from '../controllers/adminController.js';
import { getAllAchievements } from '../controllers/achievementController.js';
import { createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limit for admin routes — 100 requests per 15 min per IP
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many admin requests, please try again later' });
  },
});

router.use(auth);
router.use(adminOnly);
router.use(adminLimiter);

router.get('/stats', getAdminStats);
router.get('/servers', getAllServers);
router.put('/servers/:id/status', updateServerStatus);
router.put('/servers/:id/verify', verifyServer);
router.get('/users', getAllUsers);
router.put('/users/:userId/roles', updateUserRole);
router.post('/users/ban', banUser);
router.delete('/users/:userId/ban', unbanUser);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/achievement', awardAchievementToUser);
router.get('/users/banned', getBannedUsers);
router.get('/achievements', getAllAchievements);
router.get('/reports', getReports);
router.put('/reports/:reportId/status', updateReportStatus);
router.delete('/reviews/:reviewId', deleteReview);

// Category management (admin only)
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
