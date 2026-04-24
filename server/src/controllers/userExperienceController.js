import db from '../db.js';
import logger from '../utils/logger.js';

// Block user
export const blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.body;

    if (blockerId === userId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if already blocked
    const [existing] = await db.query(
      'SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    // Block user
    await db.query(
      'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
      [blockerId, userId]
    );

    // Remove friendship if exists
    await db.query(
      'DELETE FROM friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)',
      [blockerId, userId, userId, blockerId]
    );

    // Remove pending friend requests
    await db.query(
      'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [blockerId, userId, userId, blockerId]
    );

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    logger.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.params;

    await db.query(
      'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, userId]
    );

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    logger.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const [blocked] = await db.query(
      `SELECT bu.blocked_id, p.username, p.display_name, p.avatar_url, bu.created_at
       FROM blocked_users bu
       JOIN profiles p ON bu.blocked_id = p.id
       WHERE bu.blocker_id = ?
       ORDER BY bu.created_at DESC`,
      [userId]
    );

    res.json(blocked);
  } catch (error) {
    logger.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

// Check if user is blocked
export const checkBlocked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    const [result] = await db.query(
      'SELECT * FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
      [userId, targetUserId, targetUserId, userId]
    );

    res.json({ isBlocked: result.length > 0 });
  } catch (error) {
    logger.error('Error checking block status:', error);
    res.status(500).json({ error: 'Failed to check block status' });
  }
};

// Submit report
export const submitReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { reportedType, reportedId, reason, description } = req.body;

    if (!['user', 'server', 'review'].includes(reportedType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    if (!['spam', 'harassment', 'inappropriate', 'cheating', 'other'].includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Check if already reported recently (within 24 hours)
    const [existing] = await db.query(
      `SELECT * FROM reports
       WHERE reporter_id = ? AND reported_type = ? AND reported_id = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [reporterId, reportedType, reportedId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reported this recently' });
    }

    await db.query(
      'INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [reporterId, reportedType, reportedId, reason, description]
    );

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    logger.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${query.trim()}%`;

    const [users] = await db.query(
      `SELECT p.id, p.username, p.display_name, p.avatar_url, p.bio,
       (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = p.id) as roles
       FROM profiles p
       WHERE p.username LIKE ? OR p.display_name LIKE ?
       LIMIT ?`,
      [searchTerm, searchTerm, Number(limit)]
    );

    const formatted = users.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));

    res.json(formatted);
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};
