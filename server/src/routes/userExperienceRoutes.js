import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlocked,
  submitReport,
  searchUsers
} from '../controllers/userExperienceController.js';

const router = express.Router();

// Block/Unblock
router.post('/block', authenticate, blockUser);
router.delete('/block/:userId', authenticate, unblockUser);
router.get('/blocked', authenticate, getBlockedUsers);
router.get('/blocked/check/:targetUserId', authenticate, checkBlocked);

// Reports
router.post('/report', authenticate, submitReport);

// Search
router.get('/search', authenticate, searchUsers);

export default router;
