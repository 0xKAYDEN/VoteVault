import express from 'express';
import auth from '../middleware/auth.js';
import { checkCooldown, submitVote, getAnalytics, getVoteLink, getVotesByTracking, getGeoAnalytics } from '../controllers/voteController.js';

const router = express.Router();

/**
 * Conditional auth: requires cookie auth for private analytics,
 * but allows unauthenticated access when ?public=true (server profile page).
 */
const analyticsAuth = (req, res, next) => {
  if (req.query.public === 'true') return next(); // public server stats — no auth needed
  return auth(req, res, next);                    // dashboard analytics — requires login
};

router.get('/cooldown/:serverId', auth, checkCooldown);
router.get('/analytics', analyticsAuth, getAnalytics);
router.get('/geo', auth, getGeoAnalytics);
router.post('/', auth, submitVote);

// Vote tracking for server owners
router.get('/tracking/:serverId/link', auth, getVoteLink);
router.get('/tracking/:serverId/votes', auth, getVotesByTracking);

export default router;
