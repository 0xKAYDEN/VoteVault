import pool from '../db.js';

// Servers Management
export const getAllServers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, p.username as owner_username, p.display_name as owner_display_name
      FROM servers s
      JOIN profiles p ON s.owner_id = p.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: 'Error updating server verification' });
  }
};

// Users Management
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.email, u.created_at as account_created,
      (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = p.id) as roles
      FROM profiles p
      JOIN users u ON p.id = u.id
      ORDER BY u.created_at DESC
    `);
    
    const formatted = rows.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: 'Error updating user roles' });
  } finally {
    connection.release();
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
    
    // Total Website Visits (sum from site_stats)
    const [totalVisits] = await pool.query('SELECT SUM(visits) as count FROM site_stats');
    
    // Historical stats for charts (last 30 days)
    const [history] = await pool.query(`
      SELECT date, visits, votes 
      FROM site_stats 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY date ASC
    `);

    res.json({
      users: userCount[0].count,
      servers: serverCount[0].count,
      votes: voteCount[0].count,
      reviews: reviewCount[0].count,
      pendingServers: pendingServers[0].count,
      totalVisits: totalVisits[0].count || 0,
      history: history
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
};
