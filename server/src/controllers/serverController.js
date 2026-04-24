import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { invalidateCache } from '../middleware/cache.js';

export const getServers = async (req, res) => {
  try {
    const { status = 'approved', search, region, version } = req.query;
    let query = 'SELECT * FROM servers WHERE status = ?';
    const params = [status];

    if (search) {
      query += ' AND (name LIKE ? OR short_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (region && region !== 'all') {
      query += ' AND region = ?';
      params.push(region);
    }

    if (version && version !== 'all') {
      query += ' AND version = ?';
      params.push(version);
    }

    query += ' ORDER BY vote_count DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching servers' });
  }
};

export const getServerBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM servers WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Server not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching server' });
  }
};

export const getServerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM servers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Server not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching server by ID' });
  }
};

export const createServer = async (req, res) => {
  const { name, slug, short_description, long_description, ...rest } = req.body;
  const owner_id = req.user.id;

  try {
    const public_id = uuidv4();
    const [result] = await pool.query(
      `INSERT INTO servers (public_id, owner_id, name, slug, short_description, long_description, 
        logo_url, banner_url, website_url, discord_url, version, rate, region, 
        features, events_time, upcoming_updates) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        public_id, owner_id, name, slug, short_description, long_description,
        rest.logo_url, rest.banner_url, rest.website_url, rest.discord_url, 
        rest.version, rest.rate, rest.region,
        rest.features, rest.events_time, rest.upcoming_updates
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
    console.error(err);
    res.status(500).json({ message: 'Error creating server' });
  }
};

export const updateServer = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;
  const updates = req.body;

  try {
    const [servers] = await pool.query('SELECT * FROM servers WHERE id = ?', [id]);
    if (servers.length === 0) return res.status(404).json({ message: 'Server not found' });
    
    // Simple owner check (add admin bypass if needed)
    if (servers[0].owner_id !== owner_id) {
      return res.status(403).json({ message: 'Not authorized to update this server' });
    }

    await pool.query('UPDATE servers SET ? WHERE id = ?', [updates, id]);

    // Invalidate caches
    await invalidateCache('cache:/api/servers*');
    await invalidateCache('cache:/api/categories/*');

    res.json({ message: 'Server updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating server' });
  }
};

export const deleteServer = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;
  try {
    const [rows] = await pool.query('SELECT owner_id FROM servers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Server not found' });
    if (rows[0].owner_id !== owner_id) return res.status(403).json({ message: 'Unauthorized' });

    await pool.query('DELETE FROM servers WHERE id = ?', [id]);

    // Invalidate caches
    await invalidateCache('cache:/api/servers*');
    await invalidateCache('cache:/api/categories/*');

    res.json({ message: 'Server deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting server' });
  }
};

export const incrementVisits = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE servers SET profile_visits = profile_visits + 1 WHERE id = ?', [id]);
    res.json({ message: 'Visit recorded' });
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: 'Error fetching your servers' });
  }
};
