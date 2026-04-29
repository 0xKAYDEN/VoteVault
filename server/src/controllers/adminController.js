import pool from '../db.js';
import logger from '../utils/logger.js';
import { awardAchievement } from './achievementController.js';

// Servers Management
export const getAllServers = async (req, res) => {
  try {
    // FIX #22: Add pagination
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];

    let where = 'WHERE 1=1';
    if (status) { where += ' AND s.status = ?'; params.push(status); }
    if (search) { where += ' AND (s.name LIKE ? OR p.username LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await pool.query(
      `SELECT s.*, p.username as owner_username, p.display_name as owner_display_name
       FROM servers s
       JOIN profiles p ON s.owner_id = p.id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [total] = await pool.query(
      `SELECT COUNT(*) as count FROM servers s JOIN profiles p ON s.owner_id = p.id ${where}`,
      params
    );

    res.json({ servers: rows, total: total[0].count, page: Number(page) });
  } catch (err) {
    logger.error('Error fetching all servers:', err);
    res.status(500).json({ message: 'Error fetching all servers' });
  }
};

export const updateServerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // pending, approved, rejected, banned

  try {
    await pool.query('UPDATE servers SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Server status updated to ${status}` });
  } catch (err) {
    logger.error('Error updating server status:', err);
    res.status(500).json({ message: 'Error updating server status' });
  }
};

export const verifyServer = async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  try {
    await pool.query('UPDATE servers SET is_verified = ? WHERE id = ?', [is_verified, id]);
    res.json({ message: `Server verification updated` });
  } catch (err) {
    logger.error('Error updating server verification:', err);
    res.status(500).json({ message: 'Error updating server verification' });
  }
};

// Users Management
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.is_verified, u.is_banned, u.created_at,
        p.username, p.display_name, p.avatar_url,
        (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = u.id) as roles
      FROM users u
      JOIN profiles p ON u.id = p.id
    `;
    const params = [];

    if (search) {
      query += ' WHERE p.username LIKE ? OR p.display_name LIKE ? OR u.email LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [users] = await pool.query(query, params);

    const formatted = users.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));

    res.json(formatted);
  } catch (err) {
    logger.error('Error fetching all users:', err);
    res.status(500).json({ message: 'Error fetching all users' });
  }
};

export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body; // Array of roles

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Remove existing roles
    await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

    // Add new roles
    for (const role of roles) {
      await connection.query(
        'INSERT INTO user_roles (id, user_id, role) VALUES (UUID(), ?, ?)',
        [userId, role]
      );
    }

    await connection.commit();
    res.json({ message: 'User roles updated successfully' });
  } catch (err) {
    await connection.rollback();
    logger.error('Error updating user roles:', err);
    res.status(500).json({ message: 'Error updating user roles' });
  } finally {
    connection.release();
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId, reason, banType, expiresAt } = req.body;

    if (!['temporary', 'permanent'].includes(banType)) {
      return res.status(400).json({ error: 'Invalid ban type' });
    }

    if (banType === 'temporary' && !expiresAt) {
      return res.status(400).json({ error: 'Expiration date required for temporary ban' });
    }

    // Check if user is already banned
    const [existing] = await pool.query(
      'SELECT * FROM user_bans WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    // Create ban record
    await pool.query(
      'INSERT INTO user_bans (user_id, admin_id, reason, ban_type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, adminId, reason, banType, banType === 'temporary' ? expiresAt : null]
    );

    // Update user status
    await pool.query('UPDATE users SET is_banned = TRUE WHERE id = ?', [userId]);

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    logger.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

// Unban user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query('UPDATE users SET is_banned = FALSE WHERE id = ?', [userId]);
    await pool.query('DELETE FROM user_bans WHERE user_id = ?', [userId]);

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    logger.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

// Suspend user (temporary — sets is_banned without a ban record)
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, hours = 24 } = req.body;

    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    // Use MySQL interval so the expiry is always in the DB's own timezone
    await pool.query(
      `INSERT INTO user_bans (user_id, admin_id, reason, ban_type, expires_at)
       VALUES (?, ?, ?, 'temporary', DATE_ADD(NOW(), INTERVAL ? HOUR))
       ON DUPLICATE KEY UPDATE reason = ?, expires_at = DATE_ADD(NOW(), INTERVAL ? HOUR), ban_type = 'temporary'`,
      [userId, req.user.id, reason, Number(hours), reason, Number(hours)]
    );
    await pool.query('UPDATE users SET is_banned = TRUE WHERE id = ?', [userId]);

    logger.info(`User ${userId} suspended for ${hours}h by admin ${req.user.id}`);
    res.json({ message: `User suspended for ${hours} hours` });
  } catch (error) {
    logger.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
};

// Award achievement to user (admin)
export const awardAchievementToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { achievementId } = req.body;

    if (!achievementId) return res.status(400).json({ error: 'achievementId is required' });

    // Verify achievement exists
    const [ach] = await pool.query('SELECT id, name FROM achievements WHERE id = ?', [achievementId]);
    if (!ach.length) return res.status(404).json({ error: 'Achievement not found' });

    const awarded = await awardAchievement(userId, achievementId);
    if (!awarded) {
      return res.json({ message: 'User already has this achievement', alreadyHad: true });
    }

    logger.info(`Achievement ${achievementId} (${ach[0].name}) awarded to user ${userId} by admin ${req.user.id}`);
    res.json({ message: `Achievement "${ach[0].name}" awarded successfully` });
  } catch (error) {
    logger.error('Error awarding achievement:', error);
    res.status(500).json({ error: 'Failed to award achievement' });
  }
};

// Get banned users
export const getBannedUsers = async (req, res) => {
  try {
    const [bans] = await pool.query(
      `SELECT ub.*,
        p.username, p.display_name, p.avatar_url,
        ap.username as admin_username, ap.display_name as admin_display_name
      FROM user_bans ub
      JOIN profiles p ON ub.user_id = p.id
      JOIN profiles ap ON ub.admin_id = ap.id
      WHERE ub.expires_at IS NULL OR ub.expires_at > NOW()
      ORDER BY ub.created_at DESC`
    );

    res.json(bans);
  } catch (error) {
    logger.error('Error fetching banned users:', error);
    res.status(500).json({ error: 'Failed to fetch banned users' });
  }
};

// Get all reports — enriched with entity details
export const getReports = async (req, res) => {
  try {
    const { status = 'pending', type } = req.query;
    const params = [status];

    let typeFilter = '';
    if (type && type !== 'all') {
      typeFilter = ' AND r.reported_type = ?';
      params.push(type);
    }

    const [reports] = await pool.query(
      `SELECT r.*,
         p.username  AS reporter_username,
         p.display_name AS reporter_display_name,
         p.avatar_url   AS reporter_avatar
       FROM reports r
       JOIN profiles p ON r.reporter_id = p.id
       WHERE r.status = ? ${typeFilter}
       ORDER BY r.created_at DESC
       LIMIT 200`,
      params
    );

    // Enrich each report with the reported entity's details
    for (const report of reports) {
      try {
        if (report.reported_type === 'server') {
          const [rows] = await pool.query(
            'SELECT id, name, slug, logo_url FROM servers WHERE id = ?',
            [report.reported_id]
          );
          report.entity = rows[0] || null;
        } else if (report.reported_type === 'user') {
          const [rows] = await pool.query(
            'SELECT id, username, display_name, avatar_url FROM profiles WHERE id = ?',
            [report.reported_id]
          );
          report.entity = rows[0] || null;
        } else if (report.reported_type === 'review') {
          const [rows] = await pool.query(
            `SELECT r.id, r.comment, r.rating, s.name AS server_name, s.slug AS server_slug
             FROM reviews r JOIN servers s ON r.server_id = s.id
             WHERE r.id = ?`,
            [report.reported_id]
          );
          report.entity = rows[0] || null;
        } else if (report.reported_type === 'thread') {
          const [rows] = await pool.query(
            'SELECT id, public_id, title FROM threads WHERE id = ?',
            [report.reported_id]
          );
          report.entity = rows[0] || null;
        }
      } catch { report.entity = null; }
    }

    res.json(reports);
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Update report status
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query(
      'UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?',
      [status, adminNotes || null, reportId]
    );

    res.json({ message: 'Report status updated' });
  } catch (error) {
    logger.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};

// Delete review (admin)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    // Mark as deleted instead of actually deleting
    await pool.query(
      'UPDATE reviews SET deleted_by_admin = TRUE, admin_delete_reason = ? WHERE id = ?',
      [reason, reviewId]
    );

    // Get server_id to recalculate rating
    const [reviews] = await pool.query('SELECT server_id FROM reviews WHERE id = ?', [reviewId]);

    if (reviews.length > 0) {
      const serverId = reviews[0].server_id;

      // Recalculate server rating (excluding deleted reviews)
      const [stats] = await pool.query(
        'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE server_id = ? AND deleted_by_admin = FALSE',
        [serverId]
      );

      await pool.query(
        'UPDATE servers SET rating_avg = ?, rating_count = ? WHERE id = ?',
        [stats[0].avg || 0, stats[0].count, serverId]
      );
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Site Stats for Admin
export const getAdminStats = async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [serverCount] = await pool.query('SELECT COUNT(*) as count FROM servers');
    const [voteCount] = await pool.query('SELECT COUNT(*) as count FROM votes');
    const [reviewCount] = await pool.query('SELECT COUNT(*) as count FROM reviews');
    const [pendingServers] = await pool.query('SELECT COUNT(*) as count FROM servers WHERE status = "pending"');
    const [bannedUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_banned = TRUE');
    const [pendingReports] = await pool.query('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');

    // Total Website Visits (sum from site_stats)
    const [totalVisits] = await pool.query('SELECT SUM(visits) as count FROM site_stats');

    // Historical stats for charts (last 30 days)
    const [history] = await pool.query(`
      SELECT date, visits, votes
      FROM site_stats
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY date ASC
    `);

    // Recent reports
    const [recentReports] = await pool.query(
      `SELECT r.*, p.username as reporter_username
       FROM reports r
       JOIN profiles p ON r.reporter_id = p.id
       ORDER BY r.created_at DESC
       LIMIT 10`
    );

    res.json({
      users: userCount[0].count,
      servers: serverCount[0].count,
      votes: voteCount[0].count,
      reviews: reviewCount[0].count,
      pendingServers: pendingServers[0].count,
      bannedUsers: bannedUsers[0].count,
      pendingReports: pendingReports[0].count,
      totalVisits: totalVisits[0].count || 0,
      history: history,
      recentReports
    });
  } catch (err) {
    logger.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
};
