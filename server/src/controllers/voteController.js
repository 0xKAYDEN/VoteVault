import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { trackVote } from '../middleware/statsMiddleware.js';
import { checkVoteAchievements } from './achievementController.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

const COOLDOWN_HOURS = 12;
const COOLDOWN_SECONDS = COOLDOWN_HOURS * 3600;

export const checkCooldown = async (req, res) => {
  const { serverId } = req.params;
  const user_id = req.user.id;

  try {
    // Check Redis cache first
    const cacheKey = `vote:cooldown:${user_id}:${serverId}`;
    const cachedCooldown = await cache.ttl(cacheKey);

    if (cachedCooldown > 0) {
      logger.info(`Cache HIT: Vote cooldown for user ${user_id} on server ${serverId}`);
      return res.json({ cooldownLeft: cachedCooldown * 1000 }); // Convert to ms
    }

    // If not in cache, check database
    const [rows] = await pool.query(
      `SELECT voted_at FROM votes
       WHERE server_id = ? AND voter_user_id = ?
       AND voted_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY voted_at DESC LIMIT 1`,
      [serverId, user_id, COOLDOWN_HOURS]
    );

    if (rows.length > 0) {
      const lastVote = new Date(rows[0].voted_at);
      const cooldownEnd = new Date(lastVote.getTime() + COOLDOWN_HOURS * 3600 * 1000);
      const remainingMs = cooldownEnd.getTime() - Date.now();

      if (remainingMs > 0) {
        // Cache the cooldown
        await cache.set(cacheKey, true, Math.ceil(remainingMs / 1000));
        return res.json({ cooldownLeft: remainingMs });
      }
    }

    res.json({ cooldownLeft: null });
  } catch (err) {
    logger.error('Error checking cooldown:', err);
    res.status(500).json({ message: 'Error checking cooldown' });
  }
};

export const submitVote = async (req, res) => {
  const { server_id, challenge_type_passed, voter_fingerprint, tracking_param } = req.body;
  const user_id = req.user.id;

  // Validate challenge type
  if (!challenge_type_passed) {
    return res.status(400).json({ message: 'Challenge verification is required' });
  }

  const validChallenges = ['math', 'captcha', 'puzzle', 'slider'];
  if (!validChallenges.includes(challenge_type_passed)) {
    return res.status(400).json({ message: 'Invalid challenge type' });
  }

  try {
    // Check cooldown in Redis first (faster)
    const cacheKey = `vote:cooldown:${user_id}:${server_id}`;
    const cooldownExists = await cache.exists(cacheKey);

    if (cooldownExists) {
      return res.status(400).json({ message: 'You are still on cooldown' });
    }

    // Double check cooldown in database
    const [cooldown] = await pool.query(
      `SELECT id FROM votes
       WHERE server_id = ? AND voter_user_id = ?
       AND voted_at > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [server_id, user_id, COOLDOWN_HOURS]
    );

    if (cooldown.length > 0) {
      // Set cache for next time
      await cache.set(cacheKey, true, COOLDOWN_SECONDS);
      return res.status(400).json({ message: 'You are still on cooldown' });
    }

    const public_id = uuidv4();
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;

    await pool.query(
      `INSERT INTO votes (public_id, server_id, voter_user_id, voter_fingerprint, voter_user_agent, challenge_type_passed, tracking_param, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        public_id, server_id, user_id, voter_fingerprint,
        req.headers['user-agent']?.slice(0, 255), challenge_type_passed,
        tracking_param || null, referrer
      ]
    );

    // Set cooldown in Redis
    await cache.set(cacheKey, true, COOLDOWN_SECONDS);

    // Update server vote count
    await pool.query('UPDATE servers SET vote_count = vote_count + 1 WHERE id = ?', [server_id]);

    // Invalidate server cache
    await cache.delPattern(`cache:*/api/servers*`);
    await cache.del(`server:${server_id}`);

    // Track global vote
    await trackVote();

    // Check and award vote achievements
    await checkVoteAchievements(user_id);

    logger.info(`Vote recorded: user ${user_id} voted for server ${server_id} with challenge ${challenge_type_passed}`);
    res.json({ message: 'Vote recorded successfully' });
  } catch (err) {
    logger.error('Error submitting vote:', err);
    res.status(500).json({ message: 'Error submitting vote' });
  }
};

export const getAnalytics = async (req, res) => {
  const { server_id, from, to, challenge_type, public: isPublic, tracking_param } = req.query;
  const owner_id = req.user?.id;

  try {
    let query = `
      SELECT v.*, s.name as server_name
      FROM votes v
      JOIN servers s ON v.server_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (isPublic === 'true') {
      if (!server_id) return res.status(400).json({ message: 'server_id required for public stats' });
      query += ' AND v.server_id = ?';
      params.push(server_id);
    } else {
      if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });
      query += ' AND s.owner_id = ?';
      params.push(owner_id);

      if (server_id && server_id !== 'all') {
        query += ' AND v.server_id = ?';
        params.push(server_id);
      }
    }

    if (from) {
      query += ' AND v.voted_at >= ?';
      params.push(from.replace('T', ' ').replace('Z', ''));
    }

    if (to) {
      query += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    if (challenge_type && challenge_type !== 'all') {
      query += ' AND v.challenge_type_passed = ?';
      params.push(challenge_type);
    }

    if (tracking_param) {
      query += ' AND v.tracking_param = ?';
      params.push(tracking_param);
    }

    query += ' ORDER BY v.voted_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

// Get vote link with tracking parameter
export const getVoteLink = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { tracking_param } = req.query;

    // Verify user owns the server
    const [servers] = await pool.query(
      'SELECT id, public_id FROM servers WHERE id = ? AND owner_id = ?',
      [serverId, req.user.id]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found or not authorized' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const voteUrl = `${baseUrl}/server/${servers[0].id}?vote=true${tracking_param ? `&ref=${encodeURIComponent(tracking_param)}` : ''}`;

    res.json({
      voteUrl,
      tracking_param: tracking_param || null,
      instructions: 'Share this link with your players. When they vote, you can track them using the tracking parameter.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate vote link' });
  }
};

// Get votes by tracking parameter (for server owners)
export const getVotesByTracking = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { tracking_param, limit = 100 } = req.query;

    // Verify user owns the server
    const [servers] = await pool.query(
      'SELECT id FROM servers WHERE id = ? AND owner_id = ?',
      [serverId, req.user.id]
    );

    if (servers.length === 0) {
      return res.status(404).json({ error: 'Server not found or not authorized' });
    }

    let query = `
      SELECT v.public_id, v.voted_at, v.tracking_param, v.referrer, v.challenge_type_passed,
             p.username, p.display_name
      FROM votes v
      LEFT JOIN profiles p ON v.voter_user_id = p.id
      WHERE v.server_id = ?
    `;
    const params = [serverId];

    if (tracking_param) {
      query += ' AND v.tracking_param = ?';
      params.push(tracking_param);
    }

    query += ' ORDER BY v.voted_at DESC LIMIT ?';
    params.push(Number(limit));

    const [votes] = await pool.query(query, params);

    // Get summary by tracking param
    const [summary] = await pool.query(
      `SELECT tracking_param, COUNT(*) as count
       FROM votes
       WHERE server_id = ? AND tracking_param IS NOT NULL
       GROUP BY tracking_param
       ORDER BY count DESC`,
      [serverId]
    );

    res.json({
      votes,
      summary,
      total: votes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
};
