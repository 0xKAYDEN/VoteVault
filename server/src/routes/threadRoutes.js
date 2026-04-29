import express from 'express';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import { rateLimitRedis } from '../middleware/rateLimit.js';
import {
  getCategories, getThreads, getThread, createThread, updateThread, deleteThread,
  getReplies, createReply, deleteReply, toggleReaction, pinThread, lockThread,
} from '../controllers/threadController.js';

const router = express.Router();

// Optional auth — attaches user if token present, doesn't block if not
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {}
  next();
};

const postLimiter = rateLimitRedis({ windowMs: 60 * 1000, max: 5, keyPrefix: 'rl:thread' });

// ── Static / non-parameterised routes FIRST ──────────────────────────────────

// Categories
router.get('/categories', getCategories);

// Reactions  (must be before /:publicId wildcard)
router.post('/react/:targetType/:targetId', auth, toggleReaction);

// Reply delete  (must be before /:publicId wildcard)
router.delete('/replies/:replyId', auth, deleteReply);

// Thread list + create
router.get('/', optionalAuth, getThreads);
router.post('/', auth, postLimiter, createThread);

// ── Parameterised routes AFTER static ones ────────────────────────────────────

// Thread CRUD
router.get('/:publicId', optionalAuth, getThread);
router.put('/:publicId', auth, updateThread);
router.delete('/:publicId', auth, deleteThread);

// Replies under a thread
router.get('/:publicId/replies', optionalAuth, getReplies);
router.post('/:publicId/replies', auth, postLimiter, createReply);

// Admin actions
router.put('/:publicId/pin', auth, adminOnly, pinThread);
router.put('/:publicId/lock', auth, adminOnly, lockThread);

export default router;
