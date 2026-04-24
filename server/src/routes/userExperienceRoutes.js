import express from 'express';
import auth from '../middleware/auth.js';
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
router.post('/block', auth, blockUser);
router.delete('/block/:userId', auth, unblockUser);
router.get('/blocked', auth, getBlockedUsers);
router.get('/blocked/check/:targetUserId', auth, checkBlocked);

// Reports
router.post('/report', auth, submitReport);

// Search
router.get('/search', auth, searchUsers);

export default router;
