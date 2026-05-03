import pool from '../db.js';
import logger from '../utils/logger.js';

// Toggle favorite (add or remove)
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM server_favorites WHERE user_id = ? AND server_id = ?',
      [userId, serverId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM server_favorites WHERE user_id = ? AND server_id = ?', [userId, serverId]);
      return res.json({ favorited: false, message: 'Removed from favorites' });
    }

    await pool.query('INSERT INTO server_favorites (user_id, server_id) VALUES (?, ?)', [userId, serverId]);
    res.json({ favorited: true, message: 'Added to favorites' });
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to update favorites' });
  }
};

// Get user's favorite servers
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT s.*, sf.created_at AS favorited_at,
              u.subscription_plan, u.subscription_expires_at
       FROM server_favorites sf
       JOIN servers s ON sf.server_id = s.id
       LEFT JOIN users u ON s.owner_id = u.id
       WHERE sf.user_id = ? AND s.status = 'approved'
       ORDER BY sf.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Check if a server is favorited
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;

    const [rows] = await pool.query(
      'SELECT id FROM server_favorites WHERE user_id = ? AND server_id = ?',
      [userId, serverId]
    );

    res.json({ favorited: rows.length > 0 });
  } catch (error) {
    logger.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
};
