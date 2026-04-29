import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { cacheMiddleware } from '../middleware/cache.js';
import auth from '../middleware/auth.js';
import db from '../db.js';

const router = express.Router();

// Public routes
router.get('/:userId', cacheMiddleware(300), getUserProfile);

// User's servers (public)
router.get('/:userId/servers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, public_id, name, slug, short_description, logo_url, banner_url,
              vote_count, rating_avg, rating_count, is_online, is_verified, region, version, rate
       FROM servers WHERE owner_id = ? AND status = 'approved'
       ORDER BY vote_count DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user servers' });
  }
});

// User's reviews (public)
router.get('/:userId/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, s.name as server_name, s.slug as server_slug
       FROM reviews r
       JOIN servers s ON r.server_id = s.id
       WHERE r.user_id = ? AND (r.deleted_by_admin IS NULL OR r.deleted_by_admin = FALSE)
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// User's threads (public)
router.get('/:userId/threads', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id, t.public_id, t.title, t.reply_count, t.view_count,
              t.is_pinned, t.is_locked, t.created_at, t.last_reply_at,
              tc.name AS category_name, tc.slug AS category_slug
       FROM threads t
       JOIN thread_categories tc ON t.category_id = tc.id
       WHERE t.author_id = ? AND t.is_deleted = FALSE
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user threads' });
  }
});

// Protected routes
router.put('/profile', auth, updateUserProfile);

export default router;
