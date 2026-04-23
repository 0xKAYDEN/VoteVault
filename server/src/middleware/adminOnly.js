import pool from '../db.js';

const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const [roles] = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
      [req.user.id]
    );

    if (roles.length === 0) {
      return res.status(403).json({ message: 'Admin access denied' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: 'Server error checking admin status' });
  }
};

export default adminOnly;
