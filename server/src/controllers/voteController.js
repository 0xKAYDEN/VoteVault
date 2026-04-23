import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { trackVote } from '../middleware/statsMiddleware.js';

const COOLDOWN_HOURS = 12;

export const checkCooldown = async (req, res) => {
  const { serverId } = req.params;
  const user_id = req.user.id;

  try {
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
      return res.json({ cooldownLeft: remainingMs > 0 ? remainingMs : null });
    }

    res.json({ cooldownLeft: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error checking cooldown' });
  }
};

export const submitVote = async (req, res) => {
  const { server_id, challenge_type_passed, voter_fingerprint } = req.body;
  const user_id = req.user.id;

  try {
    // Double check cooldown on backend
    const [cooldown] = await pool.query(
      `SELECT id FROM votes 
       WHERE server_id = ? AND voter_user_id = ? 
       AND voted_at > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [server_id, user_id, COOLDOWN_HOURS]
    );

    if (cooldown.length > 0) {
      return res.status(400).json({ message: 'You are still on cooldown' });
    }

    const public_id = uuidv4();
    await pool.query(
      `INSERT INTO votes (public_id, server_id, voter_user_id, voter_fingerprint, voter_user_agent, challenge_type_passed) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        public_id, server_id, user_id, voter_fingerprint, 
        req.headers['user-agent']?.slice(0, 255), challenge_type_passed
      ]
    );

    // Update server vote count
    await pool.query('UPDATE servers SET vote_count = vote_count + 1 WHERE id = ?', [server_id]);

    // Track global vote
    await trackVote();

    res.json({ message: 'Vote recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting vote' });
  }
};

export const getAnalytics = async (req, res) => {
  const { server_id, from, to, challenge_type, public: isPublic } = req.query;
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

    query += ' ORDER BY v.voted_at ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};
