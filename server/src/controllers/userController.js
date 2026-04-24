import db from '../db.js';

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user profile with social links
    const [profiles] = await db.query(
      `SELECT id, username, display_name, avatar_url, bio, created_at,
              social_discord, social_twitter, social_youtube, social_twitch, social_website
       FROM profiles WHERE id = ?`,
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

    // Get user achievements
    const [achievements] = await db.query(
      `SELECT ua.*, a.name, a.description, a.icon, a.rarity
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`,
      [userId]
    );

    profile.achievements = achievements;

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Update user profile (authenticated user only)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      display_name,
      bio,
      avatar_url,
      social_discord,
      social_twitter,
      social_youtube,
      social_twitch,
      social_website
    } = req.body;

    await db.query(
      `UPDATE profiles SET
        display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        social_discord = ?,
        social_twitter = ?,
        social_youtube = ?,
        social_twitch = ?,
        social_website = ?
       WHERE id = ?`,
      [display_name, bio, avatar_url, social_discord, social_twitter, social_youtube, social_twitch, social_website, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
