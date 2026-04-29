import express from 'express';
import authenticate from '../middleware/auth.js';
import premiumOnly, { attachPremiumStatus } from '../middleware/premiumOnly.js';
import {
  updatePremiumProfile,
  getProfileThemes,
  getVoteStreak,
  getUserXP,
  createFriendGroup,
  getFriendGroups,
  addToFriendGroup,
  removeFromFriendGroup,
  deleteFriendGroup,
  getCustomEmojis,
  addCustomEmoji,
  deleteCustomEmoji,
  exportVoteHistory,
  getVoteHistory,
  getPremiumStatus,
} from '../controllers/premiumController.js';

const router = express.Router();

// Status (authenticated, no premium required)
router.get('/status', authenticate, getPremiumStatus);

// Profile themes list (public)
router.get('/themes', getProfileThemes);

// Profile update with premium fields (auth + soft premium check)
router.put('/profile', authenticate, attachPremiumStatus, updatePremiumProfile);

// Vote streak (authenticated)
router.get('/streak', authenticate, getVoteStreak);

// XP (authenticated, public userId lookup)
router.get('/xp', authenticate, getUserXP);
router.get('/xp/:userId', getUserXP);

// Friend groups (premium only)
router.get('/groups', authenticate, premiumOnly, getFriendGroups);
router.post('/groups', authenticate, premiumOnly, createFriendGroup);
router.post('/groups/:groupId/members', authenticate, premiumOnly, addToFriendGroup);
router.delete('/groups/:groupId/members/:friendId', authenticate, premiumOnly, removeFromFriendGroup);
router.delete('/groups/:groupId', authenticate, premiumOnly, deleteFriendGroup);

// Custom emojis (premium only)
router.get('/emojis', authenticate, premiumOnly, getCustomEmojis);
router.post('/emojis', authenticate, premiumOnly, addCustomEmoji);
router.delete('/emojis/:emojiId', authenticate, premiumOnly, deleteCustomEmoji);

// Vote history export (premium only)
router.get('/vote-history/export', authenticate, premiumOnly, exportVoteHistory);

// Vote history (all authenticated users — no premium required)
router.get('/vote-history', authenticate, getVoteHistory);

export default router;
