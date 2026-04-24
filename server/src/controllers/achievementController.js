import db from '../db.js';
import logger from '../utils/logger.js';

// Get all achievements
export const getAllAchievements = async (req, res) => {
  try {
    const [achievements] = await db.query(
      'SELECT * FROM achievements ORDER BY rarity, name'
    );
    res.json(achievements);
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

// Get user achievements
export const getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;

    const [achievements] = await db.query(
      `SELECT ua.*, a.name, a.description, a.icon, a.rarity
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`,
      [userId]
    );

    res.json(achievements);
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
};

// Award achievement to user (internal function)
export const awardAchievement = async (userId, achievementId) => {
  try {
    // Check if user already has this achievement
    const [existing] = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    if (existing.length > 0) {
      return false; // Already has achievement
    }

    // Award achievement
    await db.query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
      [userId, achievementId]
    );

    return true;
  } catch (error) {
    logger.error('Error awarding achievement:', error);
    return false;
  }
};

// Check and award vote-based achievements
export const checkVoteAchievements = async (userId) => {
  try {
    // Get user's total votes
    const [voteCount] = await db.query(
      'SELECT COUNT(*) as count FROM votes WHERE voter_user_id = ?',
      [userId]
    );

    const count = voteCount[0].count;

    // Award achievements based on vote count
    if (count >= 1) await awardAchievement(userId, 1); // First Vote
    if (count >= 10) await awardAchievement(userId, 2); // 10 Votes
    if (count >= 50) await awardAchievement(userId, 3); // 50 Votes
    if (count >= 100) await awardAchievement(userId, 4); // 100 Votes
    if (count >= 500) await awardAchievement(userId, 5); // 500 Votes
  } catch (error) {
    logger.error('Error checking vote achievements:', error);
  }
};

// Check and award review-based achievements
export const checkReviewAchievements = async (userId) => {
  try {
    const [reviewCount] = await db.query(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
      [userId]
    );

    const count = reviewCount[0].count;

    if (count >= 1) await awardAchievement(userId, 6); // First Review
    if (count >= 10) await awardAchievement(userId, 7); // 10 Reviews
  } catch (error) {
    logger.error('Error checking review achievements:', error);
  }
};

// Check and award server owner achievements
export const checkServerOwnerAchievements = async (userId) => {
  try {
    const [serverCount] = await db.query(
      'SELECT COUNT(*) as count FROM servers WHERE owner_id = ?',
      [userId]
    );

    if (serverCount[0].count >= 1) {
      await awardAchievement(userId, 8); // Server Owner
    }

    // Check if any server has 100+ votes
    const [topServer] = await db.query(
      'SELECT MAX(vote_count) as max_votes FROM servers WHERE owner_id = ?',
      [userId]
    );

    if (topServer[0].max_votes >= 100) {
      await awardAchievement(userId, 9); // Popular Server
    }
  } catch (error) {
    logger.error('Error checking server owner achievements:', error);
  }
};
