import db from '../db.js';
import logger from '../utils/logger.js';

// Add/Remove favorite
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.body;

    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE user_id = ? AND server_id = ?',
      [userId, serverId]
    );

    if (existing.length > 0) {
      // Remove favorite
      await db.query(
        'DELETE FROM user_favorites WHERE user_id = ? AND server_id = ?',
        [userId, serverId]
      );

      // Decrement favorites count
      await db.query(
        'UPDATE servers SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = ?',
        [serverId]
      );

      res.json({ message: 'Removed from favorites', isFavorited: false });
    } else {
      // Add favorite
      await db.query(
        'INSERT INTO user_favorites (user_id, server_id) VALUES (?, ?)',
        [userId, serverId]
      );

      // Increment favorites count
      await db.query(
        'UPDATE servers SET favorites_count = favorites_count + 1 WHERE id = ?',
        [serverId]
      );

      res.json({ message: 'Added to favorites', isFavorited: true });
    }
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

// Get user favorites
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const [favorites] = await db.query(
      `SELECT s.*, uf.created_at as favorited_at
       FROM user_favorites uf
       JOIN servers s ON uf.server_id = s.id
       WHERE uf.user_id = ?
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    res.json(favorites);
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Check if server is favorited
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;

    const [result] = await db.query(
      'SELECT * FROM user_favorites WHERE user_id = ? AND server_id = ?',
      [userId, serverId]
    );

    res.json({ isFavorited: result.length > 0 });
  } catch (error) {
    logger.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
};

// Add tags to server
export const addServerTags = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { tags } = req.body; // Array of tag strings

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'Tags must be a non-empty array' });
    }

    // Verify user owns the server
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Insert tags (ignore duplicates)
    for (const tag of tags) {
      await db.query(
        'INSERT IGNORE INTO server_tags (server_id, tag) VALUES (?, ?)',
        [serverId, tag.toLowerCase().trim()]
      );
    }

    res.json({ message: 'Tags added successfully' });
  } catch (error) {
    logger.error('Error adding tags:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
};

// Remove tag from server
export const removeServerTag = async (req, res) => {
  try {
    const { serverId, tag } = req.params;

    // Verify user owns the server
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'DELETE FROM server_tags WHERE server_id = ? AND tag = ?',
      [serverId, tag.toLowerCase()]
    );

    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    logger.error('Error removing tag:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
};

// Get server tags
export const getServerTags = async (req, res) => {
  try {
    const { serverId } = req.params;

    const [tags] = await db.query(
      'SELECT tag FROM server_tags WHERE server_id = ?',
      [serverId]
    );

    res.json(tags.map(t => t.tag));
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// Get servers by tag
export const getServersByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = 20 } = req.query;

    const [servers] = await db.query(
      `SELECT s.*
       FROM servers s
       JOIN server_tags st ON s.id = st.server_id
       WHERE st.tag = ? AND s.status = 'approved'
       ORDER BY s.votes DESC
       LIMIT ?`,
      [tag.toLowerCase(), Number(limit)]
    );

    res.json(servers);
  } catch (error) {
    logger.error('Error fetching servers by tag:', error);
    res.status(500).json({ error: 'Failed to fetch servers by tag' });
  }
};

// Get all tags
export const getAllTags = async (req, res) => {
  try {
    const [tags] = await db.query(
      `SELECT tag, COUNT(*) as count
       FROM server_tags st
       JOIN servers s ON st.server_id = s.id
       WHERE s.status = 'approved'
       GROUP BY tag
       ORDER BY count DESC
       LIMIT 50`
    );

    res.json(tags);
  } catch (error) {
    logger.error('Error fetching all tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// Add server update/changelog
export const addServerUpdate = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { title, description, version } = req.body;

    // Verify user owns the server
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'INSERT INTO server_updates (server_id, title, description, version) VALUES (?, ?, ?, ?)',
      [serverId, title, description, version || null]
    );

    res.json({ message: 'Update added successfully' });
  } catch (error) {
    logger.error('Error adding server update:', error);
    res.status(500).json({ error: 'Failed to add server update' });
  }
};

// Get server updates
export const getServerUpdates = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { limit = 10 } = req.query;

    const [updates] = await db.query(
      'SELECT * FROM server_updates WHERE server_id = ? ORDER BY created_at DESC LIMIT ?',
      [serverId, Number(limit)]
    );

    res.json(updates);
  } catch (error) {
    logger.error('Error fetching server updates:', error);
    res.status(500).json({ error: 'Failed to fetch server updates' });
  }
};

// Compare servers
export const compareServers = async (req, res) => {
  try {
    const { serverIds } = req.query; // Comma-separated server IDs

    if (!serverIds) {
      return res.status(400).json({ error: 'Server IDs required' });
    }

    const ids = serverIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (ids.length < 2 || ids.length > 5) {
      return res.status(400).json({ error: 'Compare 2-5 servers at a time' });
    }

    const [servers] = await db.query(
      `SELECT s.*,
        (SELECT GROUP_CONCAT(tag) FROM server_tags WHERE server_id = s.id) as tags
       FROM servers s
       WHERE s.id IN (?)`,
      [ids]
    );

    const formatted = servers.map(s => ({
      ...s,
      tags: s.tags ? s.tags.split(',') : []
    }));

    res.json(formatted);
  } catch (error) {
    logger.error('Error comparing servers:', error);
    res.status(500).json({ error: 'Failed to compare servers' });
  }
};
