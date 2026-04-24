import db from '../db.js';
import logger from '../utils/logger.js';

// Claim server ownership
export const claimServerOwnership = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId, proofText } = req.body;

    // Check if server exists
    const [servers] = await db.query('SELECT * FROM servers WHERE id = ?', [serverId]);

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if already claimed by someone
    if (servers[0].owner_id) {
      return res.status(400).json({ error: 'Server already has an owner' });
    }

    // Check if user already has a pending claim
    const [existing] = await db.query(
      'SELECT * FROM server_ownership_claims WHERE server_id = ? AND user_id = ? AND status = "pending"',
      [serverId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending claim for this server' });
    }

    // Create claim
    await db.query(
      'INSERT INTO server_ownership_claims (server_id, user_id, proof_text) VALUES (?, ?, ?)',
      [serverId, userId, proofText]
    );

    res.json({ message: 'Ownership claim submitted successfully' });
  } catch (error) {
    logger.error('Error claiming server ownership:', error);
    res.status(500).json({ error: 'Failed to claim server ownership' });
  }
};

// Get user's ownership claims
export const getUserClaims = async (req, res) => {
  try {
    const userId = req.user.id;

    const [claims] = await db.query(
      `SELECT soc.*, s.name as server_name, s.banner_url
       FROM server_ownership_claims soc
       JOIN servers s ON soc.server_id = s.id
       WHERE soc.user_id = ?
       ORDER BY soc.created_at DESC`,
      [userId]
    );

    res.json(claims);
  } catch (error) {
    logger.error('Error fetching user claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
};

// Get server analytics (owner only)
export const getServerAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;
    const { days = 30 } = req.query;

    // Verify ownership
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get analytics data
    const [analytics] = await db.query(
      `SELECT * FROM server_analytics
       WHERE server_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY date DESC`,
      [serverId, Number(days)]
    );

    // Get totals
    const [totals] = await db.query(
      `SELECT
        SUM(views) as total_views,
        SUM(clicks) as total_clicks,
        SUM(votes) as total_votes
       FROM server_analytics
       WHERE server_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [serverId, Number(days)]
    );

    res.json({
      analytics,
      totals: totals[0]
    });
  } catch (error) {
    logger.error('Error fetching server analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Edit server details (owner only)
export const editServerDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;
    const { name, description, website, discord_invite, banner_url } = req.body;

    // Verify ownership
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update server
    await db.query(
      `UPDATE servers SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        website = COALESCE(?, website),
        discord_invite = COALESCE(?, discord_invite),
        banner_url = COALESCE(?, banner_url)
       WHERE id = ?`,
      [name, description, website, discord_invite, banner_url, serverId]
    );

    res.json({ message: 'Server updated successfully' });
  } catch (error) {
    logger.error('Error editing server:', error);
    res.status(500).json({ error: 'Failed to edit server' });
  }
};

// Track server view (for analytics)
export const trackServerView = async (serverId) => {
  try {
    await db.query(
      `INSERT INTO server_analytics (server_id, date, views)
       VALUES (?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [serverId]
    );
  } catch (error) {
    logger.error('Error tracking server view:', error);
  }
};

// Track server click (for analytics)
export const trackServerClick = async (serverId) => {
  try {
    await db.query(
      `INSERT INTO server_analytics (server_id, date, clicks)
       VALUES (?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
      [serverId]
    );
  } catch (error) {
    logger.error('Error tracking server click:', error);
  }
};

// Track server vote (for analytics)
export const trackServerVote = async (serverId) => {
  try {
    await db.query(
      `INSERT INTO server_analytics (server_id, date, votes)
       VALUES (?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE votes = votes + 1`,
      [serverId]
    );
  } catch (error) {
    logger.error('Error tracking server vote:', error);
  }
};

// Get server owner dashboard stats
export const getOwnerDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all servers owned by user
    const [servers] = await db.query(
      'SELECT id, name, votes, rating_avg, favorites_count FROM servers WHERE owner_id = ?',
      [userId]
    );

    // Get total stats across all servers
    const [totals] = await db.query(
      `SELECT
        SUM(sa.views) as total_views,
        SUM(sa.clicks) as total_clicks,
        SUM(sa.votes) as total_votes
       FROM server_analytics sa
       JOIN servers s ON sa.server_id = s.id
       WHERE s.owner_id = ? AND sa.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );

    res.json({
      servers,
      totals: totals[0]
    });
  } catch (error) {
    logger.error('Error fetching owner dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Update active player count (for game servers to report)
export const updateActivePlayers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;
    const { active_players } = req.body;

    if (typeof active_players !== 'number' || active_players < 0) {
      return res.status(400).json({ error: 'Invalid active_players value' });
    }

    // Verify ownership
    const [servers] = await db.query(
      'SELECT owner_id FROM servers WHERE id = ?',
      [serverId]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (servers[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update both active_players AND player_count for consistency
    await db.query(
      'UPDATE servers SET active_players = ?, player_count = ?, last_active_update = NOW() WHERE id = ?',
      [active_players, active_players, serverId]
    );

    res.json({ message: 'Active players updated successfully', active_players });
  } catch (error) {
    logger.error('Error updating active players:', error);
    res.status(500).json({ error: 'Failed to update active players' });
  }
};
