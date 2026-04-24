import db from '../db.js';
import logger from '../utils/logger.js';

// Get user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const [prefs] = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (prefs.length === 0) {
      // Create default preferences
      await db.query(
        'INSERT INTO user_preferences (user_id) VALUES (?)',
        [userId]
      );

      res.json({ theme: 'system', language: 'en' });
    } else {
      res.json(prefs[0]);
    }
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, language } = req.body;

    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    await db.query(
      `INSERT INTO user_preferences (user_id, theme, language)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         theme = COALESCE(?, theme),
         language = COALESCE(?, language)`,
      [userId, theme, language, theme, language]
    );

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Get user achievements
export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    const [achievements] = await db.query(
      'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC',
      [userId]
    );

    res.json(achievements);
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

// Award achievement
export const awardAchievement = async (userId, achievementType, achievementName, description) => {
  try {
    await db.query(
      'INSERT IGNORE INTO user_achievements (user_id, achievement_type, achievement_name, description) VALUES (?, ?, ?, ?)',
      [userId, achievementType, achievementName, description]
    );
  } catch (error) {
    logger.error('Error awarding achievement:', error);
  }
};

// Check and award achievements based on user activity
export const checkAchievements = async (userId) => {
  try {
    // First Review
    const [reviews] = await db.query(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
      [userId]
    );
    if (reviews[0].count === 1) {
      await awardAchievement(userId, 'first_review', 'First Review', 'Left your first server review');
    }
    if (reviews[0].count >= 10) {
      await awardAchievement(userId, 'reviewer', 'Reviewer', 'Left 10 server reviews');
    }
    if (reviews[0].count >= 50) {
      await awardAchievement(userId, 'critic', 'Critic', 'Left 50 server reviews');
    }

    // First Vote
    const [votes] = await db.query(
      'SELECT COUNT(*) as count FROM votes WHERE user_id = ?',
      [userId]
    );
    if (votes[0].count === 1) {
      await awardAchievement(userId, 'first_vote', 'First Vote', 'Cast your first vote');
    }
    if (votes[0].count >= 100) {
      await awardAchievement(userId, 'voter', 'Voter', 'Cast 100 votes');
    }

    // First Friend
    const [friends] = await db.query(
      'SELECT COUNT(*) as count FROM friendships WHERE user_id_1 = ? OR user_id_2 = ?',
      [userId, userId]
    );
    if (friends[0].count === 1) {
      await awardAchievement(userId, 'first_friend', 'First Friend', 'Made your first friend');
    }
    if (friends[0].count >= 10) {
      await awardAchievement(userId, 'social', 'Social Butterfly', 'Made 10 friends');
    }

    // Server Owner
    const [servers] = await db.query(
      'SELECT COUNT(*) as count FROM servers WHERE owner_id = ?',
      [userId]
    );
    if (servers[0].count >= 1) {
      await awardAchievement(userId, 'server_owner', 'Server Owner', 'Own a server on the list');
    }

  } catch (error) {
    logger.error('Error checking achievements:', error);
  }
};
