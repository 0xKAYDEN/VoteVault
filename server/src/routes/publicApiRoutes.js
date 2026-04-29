/**
 * Public API — authenticated via API key (Authorization: Bearer vv_...)
 * Rate limited per subscription plan.
 */
import express from 'express';
import pool from '../db.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// All routes require a valid API key
router.use(apiKeyAuth);

// ── GET /api/v1/servers ───────────────────────────────────────────────────────
// List approved servers (paginated)
router.get('/servers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, region, version } = req.query;
    const pageSize = Math.min(Number(limit), 100);
    const offset = (Number(page) - 1) * pageSize;
    const params = [];

    let where = "s.status = 'approved'";
    if (search) { where += ' AND (s.name LIKE ? OR s.short_description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (region) { where += ' AND s.region = ?'; params.push(region); }
    if (version) { where += ' AND s.version = ?'; params.push(version); }

    const [rows] = await pool.query(
      `SELECT s.id, s.public_id, s.name, s.slug, s.short_description,
              s.logo_url, s.banner_url, s.website_url, s.discord_url,
              s.version, s.rate, s.region, s.is_online, s.is_verified,
              s.vote_count, s.rating_avg, s.rating_count, s.active_players,
              s.created_at
       FROM servers s
       WHERE ${where}
       ORDER BY s.vote_count DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [total] = await pool.query(
      `SELECT COUNT(*) AS count FROM servers s WHERE ${where}`,
      params
    );

    res.json({ data: rows, total: total[0].count, page: Number(page), pageSize });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// ── GET /api/v1/servers/:slug ─────────────────────────────────────────────────
router.get('/servers/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.public_id, s.name, s.slug, s.short_description, s.long_description,
              s.logo_url, s.banner_url, s.website_url, s.discord_url,
              s.version, s.rate, s.region, s.is_online, s.is_verified,
              s.vote_count, s.rating_avg, s.rating_count, s.active_players,
              s.features, s.events_time, s.upcoming_updates, s.created_at
       FROM servers s
       WHERE s.slug = ? AND s.status = 'approved'`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Server not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// ── POST /api/v1/servers/:slug/vote-link ─────────────────────────────────────
// Generate a vote URL with a custom tracking token.
// Your game server calls this, gets back a URL, then redirects the player to it.
// When the player votes, the token is stored. You then call vote-check?ref=<token>
// to confirm the vote and grant the in-game reward.
router.post('/servers/:slug/vote-link', async (req, res) => {
  try {
    const { ref } = req.body;
    if (!ref || typeof ref !== 'string' || ref.trim().length === 0) {
      return res.status(400).json({ error: '`ref` is required — pass your custom token/identifier' });
    }
    if (ref.length > 255) {
      return res.status(400).json({ error: '`ref` must be 255 characters or less' });
    }

    const [servers] = await pool.query(
      'SELECT id, slug, name FROM servers WHERE slug = ? AND status = ?',
      [req.params.slug, 'approved']
    );
    if (!servers.length) return res.status(404).json({ error: 'Server not found' });

    const baseUrl  = process.env.FRONTEND_URL || 'http://localhost:8080';
    const voteUrl  = `${baseUrl}/server/${servers[0].slug}?vote=1&ref=${encodeURIComponent(ref.trim())}`;

    res.json({
      voteUrl,
      ref: ref.trim(),
      slug: servers[0].slug,
      serverName: servers[0].name,
      hint: 'Redirect your player to `voteUrl`. After they vote, call vote-check?ref=<your_ref> to confirm.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate vote link' });
  }
});

// ── GET /api/v1/servers/:slug/vote-check ─────────────────────────────────────
// Check if a player has voted in the last 12 hours.
// Two lookup modes:
//   ?username=Shadow        — look up by VoteVault username
//   ?ref=<your_token>       — look up by the custom ref you embedded in the vote URL
router.get('/servers/:slug/vote-check', async (req, res) => {
  try {
    const { username, ref } = req.query;
    if (!username && !ref) {
      return res.status(400).json({ error: 'Provide either `username` or `ref` query param' });
    }

    const [servers] = await pool.query('SELECT id FROM servers WHERE slug = ?', [req.params.slug]);
    if (!servers.length) return res.status(404).json({ error: 'Server not found' });
    const serverId = servers[0].id;

    let votes;

    if (ref) {
      // ── Lookup by tracking token (ref) ──────────────────────────────────
      // Find the most recent vote for this server that used this ref token
      // within the last 12 hours
      const [rows] = await pool.query(
        `SELECT v.voted_at, v.tracking_param,
                p.username AS voter_username, p.id AS voter_id
         FROM votes v
         LEFT JOIN profiles p ON v.voter_user_id = p.id
         WHERE v.server_id = ?
           AND v.tracking_param = ?
           AND v.voted_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
         ORDER BY v.voted_at DESC
         LIMIT 1`,
        [serverId, ref]
      );
      votes = rows;

      if (!votes.length) {
        return res.json({ hasVoted: false, cooldownLeft: null, ref, username: null });
      }

      const cooldownEnd  = new Date(votes[0].voted_at).getTime() + 12 * 3600 * 1000;
      const cooldownLeft = Math.max(0, cooldownEnd - Date.now());

      return res.json({
        hasVoted:      true,
        cooldownLeft,
        cooldownEndsAt: new Date(cooldownEnd).toISOString(),
        trackingParam:  votes[0].tracking_param,
        ref,
        username:       votes[0].voter_username || null,
      });
    }

    // ── Lookup by username ───────────────────────────────────────────────
    const [profiles] = await pool.query('SELECT id FROM profiles WHERE username = ?', [username]);
    if (!profiles.length) return res.json({ hasVoted: false, cooldownLeft: null });

    const [rows] = await pool.query(
      `SELECT voted_at, tracking_param FROM votes
       WHERE server_id = ? AND voter_user_id = ?
       AND voted_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
       ORDER BY voted_at DESC LIMIT 1`,
      [serverId, profiles[0].id]
    );

    if (!rows.length) return res.json({ hasVoted: false, cooldownLeft: null });

    const cooldownEnd  = new Date(rows[0].voted_at).getTime() + 12 * 3600 * 1000;
    const cooldownLeft = Math.max(0, cooldownEnd - Date.now());

    res.json({
      hasVoted:      true,
      cooldownLeft,
      cooldownEndsAt: new Date(cooldownEnd).toISOString(),
      trackingParam:  rows[0].tracking_param || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check vote' });
  }
});

// ── GET /api/v1/my-server-id ──────────────────────────────────────────────────
// Get the public_id of the server associated with this API key
router.get('/my-server-id', async (req, res) => {
  try {
    if (!req.apiKey.serverId) {
      // If the key is not restricted to a server, return all servers owned by this user
      const [servers] = await pool.query(
        'SELECT id, public_id, name, slug FROM servers WHERE owner_id = ?',
        [req.apiKey.ownerId]
      );
      return res.json({ data: servers });
    }

    const [rows] = await pool.query(
      'SELECT public_id, name, slug FROM servers WHERE id = ?',
      [req.apiKey.serverId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Server not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch server ID' });
  }
});

// ── GET /api/v1/servers/:slug/votes ──────────────────────────────────────────
// Recent votes for a server (owner's key only)
// Optional filters: ?tracking_param=discord&from=2024-01-01&limit=50
router.get('/servers/:slug/votes', async (req, res) => {
  try {
    const [servers] = await pool.query(
      'SELECT id, owner_id FROM servers WHERE slug = ?',
      [req.params.slug]
    );
    if (!servers.length) return res.status(404).json({ error: 'Server not found' });
    if (servers[0].owner_id !== req.apiKey.ownerId) {
      return res.status(403).json({ error: 'You do not own this server' });
    }

    const { limit = 50, from, tracking_param } = req.query;
    const params = [servers[0].id];
    let filters = '';

    if (from) { filters += ' AND v.voted_at >= ?'; params.push(from); }
    if (tracking_param) { filters += ' AND v.tracking_param = ?'; params.push(tracking_param); }

    params.push(Math.min(Number(limit), 200));

    const [votes] = await pool.query(
      `SELECT v.public_id, v.voted_at, v.tracking_param, v.challenge_type_passed,
              v.voter_country, v.voter_city, v.is_suspicious,
              p.username AS voter_username
       FROM votes v
       LEFT JOIN profiles p ON v.voter_user_id = p.id
       WHERE v.server_id = ? ${filters}
       ORDER BY v.voted_at DESC
       LIMIT ?`,
      params
    );

    // Summary grouped by tracking_param
    const [summary] = await pool.query(
      `SELECT tracking_param, COUNT(*) AS count
       FROM votes
       WHERE server_id = ? AND tracking_param IS NOT NULL
       GROUP BY tracking_param
       ORDER BY count DESC`,
      [servers[0].id]
    );

    res.json({ data: votes, total: votes.length, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// ── POST /api/v1/servers/:slug/active-players ────────────────────────────────
// Update active player count (owner's key only). Call every 1–5 min from your game server.
router.post('/servers/:slug/active-players', async (req, res) => {
  try {
    const { active_players } = req.body;

    if (typeof active_players !== 'number' || active_players < 0) {
      return res.status(400).json({ error: 'active_players must be a non-negative number' });
    }

    const [servers] = await pool.query(
      'SELECT id, owner_id FROM servers WHERE slug = ?',
      [req.params.slug]
    );
    if (!servers.length) return res.status(404).json({ error: 'Server not found' });
    if (servers[0].owner_id !== req.apiKey.ownerId) {
      return res.status(403).json({ error: 'You do not own this server' });
    }

    await pool.query(
      'UPDATE servers SET active_players = ?, last_active_update = NOW() WHERE id = ?',
      [active_players, servers[0].id]
    );

    res.json({ message: 'Active players updated', active_players, slug: req.params.slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update active players' });
  }
});

// ── GET /api/v1/me ────────────────────────────────────────────────────────────
// Info about the API key owner
router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.username, p.display_name, p.avatar_url,
              (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = p.id) AS roles
       FROM profiles p WHERE p.id = ?`,
      [req.apiKey.ownerId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const profile = rows[0];
    profile.roles = profile.roles ? profile.roles.split(',') : [];
    res.json({
      data: profile,
      apiKey: {
        plan: req.apiKey.plan,
        limits: req.apiKey.limits,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
