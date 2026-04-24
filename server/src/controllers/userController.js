import db from '../db.js';

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user profile
    const [profiles] = await db.query(
      'SELECT id, username, display_name, avatar_url, bio, created_at FROM profiles WHERE id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = profiles[0];

    // Get user roles
    const [roles] = await db.query(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );

    profile.roles = roles.map(r => r.role);

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};
