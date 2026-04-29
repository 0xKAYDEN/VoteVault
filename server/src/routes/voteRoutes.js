import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCooldown, submitVote, getAnalytics, getVoteLink, getVotesByTracking, getGeoAnalytics } from '../controllers/voteController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {}
  next();
};

router.get('/cooldown/:serverId', auth, checkCooldown);
router.get('/analytics', optionalAuth, getAnalytics);  // public=true works without auth
router.get('/geo', auth, getGeoAnalytics);
router.post('/', auth, submitVote); // Removed verifyRecaptcha - using challenges instead

// Vote tracking for server owners
router.get('/tracking/:serverId/link', auth, getVoteLink);
router.get('/tracking/:serverId/votes', auth, getVotesByTracking);

export default router;
