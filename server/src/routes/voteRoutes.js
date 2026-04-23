import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCooldown, submitVote, getAnalytics } from '../controllers/voteController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next();
  }
};

router.get('/cooldown/:serverId', auth, checkCooldown);
router.get('/analytics', optionalAuth, getAnalytics);
router.post('/', auth, submitVote);

export default router;
