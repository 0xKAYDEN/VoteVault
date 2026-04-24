import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { notifyNewReview } from './notificationController.js';

export const getReviews = async (req, res) => {
  const { serverId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.username, p.display_name, p.avatar_url,
       (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = r.user_id) as roles
       FROM reviews r 
       LEFT JOIN profiles p ON r.user_id = p.id 
       WHERE r.server_id = ? 
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [serverId, Number(limit), Number(offset)]
    );

    const formatted = rows.map(r => ({
      ...r,
      roles: r.roles ? r.roles.split(',') : []
    }));

    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE server_id = ?',
      [serverId]
    );

    res.json({
      reviews: formatted,
      total: total[0].count,
      page: Number(page),
      totalPages: Math.ceil(total[0].count / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const submitReply = async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const user_id = req.user.id;

  try {
    // Check if user is owner of the server for this review
    const [rows] = await pool.query(
      `SELECT s.owner_id FROM reviews r 
       JOIN servers s ON r.server_id = s.id 
       WHERE r.id = ?`,
      [reviewId]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Review not found' });
    if (rows[0].owner_id !== user_id) return res.status(403).json({ message: 'Not authorized' });

    await pool.query(
      'UPDATE reviews SET owner_response = ? WHERE id = ?',
      [reply, reviewId]
    );

    res.json({ message: 'Reply submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting reply' });
  }
};

export const submitReview = async (req, res) => {
  const { server_id, rating, comment } = req.body;
  const user_id = req.user.id;

  try {
    const public_id = uuidv4();
    await pool.query(
      `INSERT INTO reviews (public_id, server_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [public_id, server_id, user_id, rating, comment]
    );

    // Recalculate server rating
    const [stats] = await pool.query(
      'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE server_id = ?',
      [server_id]
    );

    await pool.query(
      'UPDATE servers SET rating_avg = ?, rating_count = ? WHERE id = ?',
      [stats[0].avg || 0, stats[0].count, server_id]
    );

    // Send notification to server owner
    await notifyNewReview(server_id, user_id);

    res.json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting review' });
  }
};

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const user_id = req.user.id;

  try {
    const [rows] = await pool.query('SELECT user_id, server_id FROM reviews WHERE id = ?', [reviewId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Review not found' });
    if (rows[0].user_id !== user_id) return res.status(403).json({ message: 'Unauthorized' });

    const server_id = rows[0].server_id;

    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, reviewId]
    );

    // Recalculate server rating
    const [stats] = await pool.query(
      'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE server_id = ?',
      [server_id]
    );

    await pool.query(
      'UPDATE servers SET rating_avg = ?, rating_count = ? WHERE id = ?',
      [stats[0].avg || 0, stats[0].count, server_id]
    );

    res.json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating review' });
  }
};
