import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { invalidateCache } from '../middleware/cache.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

export const getServers = async (req, res) => {
  try {
    const { status = 'approved', search, region, version } = req.query;

    let query = `SELECT s.*, u.subscription_plan, u.subscription_expires_at,
                        p.username AS owner_username, p.display_name AS owner_display_name, p.id AS owner_id
                 FROM servers s
                 LEFT JOIN users u ON s.owner_id = u.id
                 LEFT JOIN profiles p ON s.owner_id = p.id
                 WHERE s.status = ?`;
    const params = [status];

    if (search) {
      query += ' AND (s.name LIKE ? OR s.short_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (region && region !== 'all') {
      query += ' AND s.region = ?';
      params.push(region);
    }

    if (version && version !== 'all') {
      query += ' AND s.version = ?';
      params.push(version);
    }

    query += ` ORDER BY
      CASE
        WHEN u.subscription_plan IN ('enterprise') AND u.subscription_expires_at > NOW() THEN 3
        WHEN u.subscription_plan IN ('pro') AND u.subscription_expires_at > NOW() THEN 2
        WHEN u.subscription_plan IN ('starter','basic') AND u.subscription_expires_at > NOW() THEN 1
        ELSE 0
      END DESC,
      s.vote_count DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching servers:', err);
    res.status(500).json({ message: 'Error fetching servers' });
  }
};

export const getServerBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.*,
              p.username AS owner_username,
              p.display_name AS owner_display_name,
              p.avatar_url AS owner_avatar_url
       FROM servers s
       LEFT JOIN profiles p ON s.owner_id = p.id
       WHERE s.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Server not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    logger.error('Error fetching server by slug:', err);
    res.status(500).json({ message: 'Error fetching server' });
  }
};

export const getServerById = async (req, res) => {
  const { id } = req.params;
  try {
    // Try cache first
    const cacheKey = `server:id:${id}`;
    const cachedServer = await cache.get(cacheKey);

    if (cachedServer) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return res.json(cachedServer);
    }

    logger.info(`Cache MISS: ${cacheKey}`);
    const [rows] = await pool.query('SELECT * FROM servers WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Cache for 10 minutes
    await cache.set(cacheKey, rows[0], 600);

    res.json(rows[0]);
  } catch (err) {
    logger.error('Error fetching server by ID:', err);
    res.status(500).json({ message: 'Error fetching server by ID' });
  }
};

export const createServer = async (req, res) => {
  const { name, slug, short_description, long_description, recaptchaToken, ...rest } = req.body;
  const owner_id = req.user.id;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA token is required' });
  }

  try {
    // ── Server limit per subscription ────────────────────────────────────────
    const SERVER_LIMITS = { free: 2, starter: 5, pro: 15, enterprise: Infinity };

    const [subRows] = await pool.query(
      `SELECT plan FROM payments WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [owner_id]
    );
    const rawPlan = subRows[0]?.plan || 'free';
    const plan = rawPlan.includes('enterprise') ? 'enterprise'
      : rawPlan.includes('pro') ? 'pro'
      : rawPlan.includes('starter') ? 'starter'
      : 'free';
    const limit = SERVER_LIMITS[plan];

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM servers WHERE owner_id = ?',
      [owner_id]
    );
    const currentCount = countRows[0].count;

    if (currentCount >= limit) {
      return res.status(403).json({
        message: `Your ${plan} plan allows a maximum of ${limit} server${limit === 1 ? '' : 's'}. Upgrade your plan to add more.`,
        limit,
        current: currentCount,
        requiresUpgrade: true,
      });
    }

    // ── New servers start as 'pending' — admin must approve ──────────────────
    const public_id = uuidv4();
    const [result] = await pool.query(
      `INSERT INTO servers (public_id, owner_id, name, slug, short_description, long_description,
        logo_url, banner_url, website_url, discord_url, youtube_url, facebook_url, twitter_url, twitch_url,
        version, rate, region, features, events_time, upcoming_updates, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        public_id, owner_id, name, slug, short_description, long_description,
        rest.logo_url || null, rest.banner_url || null,
        rest.website_url || null, rest.discord_url || null,
        rest.youtube_url || null, rest.facebook_url || null,
        rest.twitter_url || null, rest.twitch_url || null,
        rest.version || null, rest.rate || null, rest.region || null,
        rest.features || null, rest.events_time || null, rest.upcoming_updates || null,
      ]
    );

    // Promote to server_owner if they are currently a player, or add the role if they have no roles.
    // This avoids creating multiple rows if they only had the 'player' role.
    const [roles] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [owner_id]);
    const hasRole = roles.length > 0;
    const isPlayerOnly = roles.length === 1 && roles[0].role === 'player';

    if (isPlayerOnly) {
      await pool.query(
        'UPDATE user_roles SET role = ? WHERE user_id = ? AND role = ?',
        ['server_owner', owner_id, 'player']
      );
    } else if (!hasRole) {
      await pool.query(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [uuidv4(), owner_id, 'server_owner']
      );
    }
    // If they already have other roles (like admin), we keep them as they are or could add server_owner
    // but the request was to specifically update the 'player' rule.

    // Invalidate caches
    await invalidateCache('cache:/api/servers*');
    await invalidateCache('cache:/api/categories/*');

    res.status(201).json({ id: result.insertId, public_id, slug });
  } catch (err) {
    logger.error('Error creating server:', err);
    res.status(500).json({ message: 'Error creating server' });
  }
};

export const updateServer = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;

  try {
    const [servers] = await pool.query('SELECT owner_id, slug FROM servers WHERE id = ?', [id]);
    if (servers.length === 0) return res.status(404).json({ message: 'Server not found' });
    if (servers[0].owner_id !== owner_id) return res.status(403).json({ message: 'Not authorized to update this server' });

    // Whitelist allowed fields — prevents arbitrary column injection
    const ALLOWED = [
      'name', 'short_description', 'long_description', 'logo_url', 'banner_url',
      'website_url', 'discord_url', 'youtube_url', 'facebook_url', 'twitter_url', 'twitch_url',
      'version', 'rate', 'region', 'features', 'events_time', 'upcoming_updates',
      'is_online', 'active_players',
    ];

    // Gate banner_url and logo_url to Starter+ plans (Section 5.6)
    const PAID_ONLY_FIELDS = ['banner_url', 'logo_url'];
    const hasPaidPlan = PAID_ONLY_FIELDS.some(f => f in req.body);
    if (hasPaidPlan) {
      const [activePlan] = await pool.query(
        `SELECT plan FROM payments WHERE user_id = ? AND status = 'active' AND expires_at > NOW() LIMIT 1`,
        [owner_id]
      );
      const paidPlans = ['starter', 'pro', 'enterprise'];
      const userPlan = activePlan[0]?.plan || 'free';
      if (!paidPlans.includes(userPlan)) {
        return res.status(403).json({ message: 'Custom banner and logo require a Starter plan or higher.' });
      }
    }
    const body = req.body;
    const setClauses = [];
    const values = [];
    for (const key of ALLOWED) {
      if (key in body) {
        setClauses.push(`${key} = ?`);
        values.push(body[key] ?? null);
      }
    }
    if (setClauses.length === 0) return res.status(400).json({ message: 'No valid fields to update' });
    values.push(id);

    await pool.query(`UPDATE servers SET ${setClauses.join(', ')} WHERE id = ?`, values);

    // Invalidate caches
    await invalidateCache('cache:/api/servers*');
    await invalidateCache('cache:/api/categories/*');
    await cache.delPattern('servers:list:*');
    await cache.del(`server:id:${id}`);
    await cache.del(`server:slug:${servers[0].slug}`);

    res.json({ message: 'Server updated successfully' });
  } catch (err) {
    logger.error('Error updating server:', err);
    res.status(500).json({ message: 'Error updating server' });
  }
};

export const deleteServer = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;
  try {
    const [rows] = await pool.query('SELECT owner_id, slug FROM servers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Server not found' });
    if (rows[0].owner_id !== owner_id) return res.status(403).json({ message: 'Unauthorized' });

    await pool.query('DELETE FROM servers WHERE id = ?', [id]);

    // Invalidate caches
    await invalidateCache('cache:/api/servers*');
    await invalidateCache('cache:/api/categories/*');
    await cache.delPattern('servers:list:*');
    await cache.del(`server:id:${id}`);
    await cache.del(`server:slug:${rows[0].slug}`);

    logger.info(`Server deleted: ${id} by user ${owner_id}`);
    res.json({ message: 'Server deleted successfully' });
  } catch (err) {
    logger.error('Error deleting server:', err);
    res.status(500).json({ message: 'Error deleting server' });
  }
};

export const incrementVisits = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE servers SET profile_visits = profile_visits + 1 WHERE id = ?', [id]);

    // Invalidate server cache (visits count changed)
    await cache.del(`server:id:${id}`);

    res.json({ message: 'Visit recorded' });
  } catch (err) {
    logger.error('Error recording visit:', err);
    res.status(500).json({ message: 'Error recording visit' });
  }
};

export const getDashboardStats = async (req, res) => {
  const owner_id = req.user.id;
  try {
    const [srvs] = await pool.query(
      'SELECT id, vote_count, rating_avg, profile_visits FROM servers WHERE owner_id = ?',
      [owner_id]
    );

    const totalVotes = srvs.reduce((s, x) => s + (x.vote_count || 0), 0);
    const totalVisits = srvs.reduce((s, x) => s + (x.profile_visits || 0), 0);
    const avgRating = srvs.length ? srvs.reduce((s, x) => s + (Number(x.rating_avg) || 0), 0) / srvs.length : 0;
    
    let votes24h = 0;
    if (srvs.length > 0) {
      const ids = srvs.map(s => s.id);
      const [votes] = await pool.query(
        'SELECT COUNT(*) as count FROM votes WHERE server_id IN (?) AND voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [ids]
      );
      votes24h = votes[0].count;
    }

    // Recent reviews
    const [recentReviews] = await pool.query(
      `SELECT r.*, p.username, p.display_name, s.name as server_name 
       FROM reviews r 
       JOIN servers s ON r.server_id = s.id 
       LEFT JOIN profiles p ON r.user_id = p.id 
       WHERE s.owner_id = ? 
       ORDER BY r.created_at DESC 
       LIMIT 5`,
      [owner_id]
    );

    res.json({
      servers: srvs.length,
      totalVotes,
      totalVisits,
      avgRating,
      votes24h,
      recentReviews
    });
  } catch (err) {
    logger.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

export const getMyServers = async (req, res) => {
  const owner_id = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM servers WHERE owner_id = ? ORDER BY created_at DESC',
      [owner_id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching your servers:', err);
    res.status(500).json({ message: 'Error fetching your servers' });
  }
};

// Get all reviews for the owner's servers with pagination
export const getMyReviews = async (req, res) => {
  const owner_id = req.user.id;
  const { page = 1, limit = 20, server_id, rating, replied } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Build filter
    let where = 's.owner_id = ? AND r.deleted_by_admin = FALSE';
    const params = [owner_id];

    if (server_id && server_id !== 'all') {
      where += ' AND r.server_id = ?';
      params.push(server_id);
    }
    if (rating && rating !== 'all') {
      where += ' AND r.rating = ?';
      params.push(Number(rating));
    }
    if (replied === 'yes') {
      where += ' AND r.owner_response IS NOT NULL';
    } else if (replied === 'no') {
      where += ' AND r.owner_response IS NULL';
    }

    const [reviews] = await pool.query(
      `SELECT r.*, p.username, p.display_name, p.avatar_url, s.name AS server_name, s.slug AS server_slug
       FROM reviews r
       JOIN servers s ON r.server_id = s.id
       LEFT JOIN profiles p ON r.user_id = p.id
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [total] = await pool.query(
      `SELECT COUNT(*) AS count FROM reviews r JOIN servers s ON r.server_id = s.id WHERE ${where}`,
      params
    );

    // Rating summary
    const [summary] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         AVG(r.rating) AS avg_rating,
         SUM(CASE WHEN r.owner_response IS NULL THEN 1 ELSE 0 END) AS unanswered
       FROM reviews r
       JOIN servers s ON r.server_id = s.id
       WHERE s.owner_id = ? AND r.deleted_by_admin = FALSE`,
      [owner_id]
    );

    res.json({
      reviews,
      total: total[0].count,
      page: Number(page),
      totalPages: Math.ceil(total[0].count / Number(limit)),
      summary: summary[0],
    });
  } catch (err) {
    logger.error('Error fetching owner reviews:', err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};
