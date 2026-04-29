import db from '../db.js';
import logger from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import { awardAchievement } from './achievementController.js';

const FREE_BIO_LIMIT = 200;
const PREMIUM_BIO_LIMIT = 1000;

// ─── Profile Enhancements ────────────────────────────────────────────────────

export const updatePremiumProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { banner_url, profile_theme, is_animated_avatar, custom_status, custom_status_emoji, bio, display_name, avatar_url } = req.body;

    // Bio length enforcement
    if (bio !== undefined) {
      const maxBio = req.isPremium ? PREMIUM_BIO_LIMIT : FREE_BIO_LIMIT;
      if (bio.length > maxBio) {
        return res.status(400).json({
          error: `Bio cannot exceed ${maxBio} characters${!req.isPremium ? '. Upgrade to Premium for 1000 characters.' : '.'}`
        });
      }
    }

    // Premium-only fields
    const premiumFields = {};
    if (req.isPremium) {
      if (banner_url !== undefined) premiumFields.banner_url = banner_url;
      if (profile_theme !== undefined) premiumFields.profile_theme = profile_theme;
      if (is_animated_avatar !== undefined) premiumFields.is_animated_avatar = is_animated_avatar ? 1 : 0;
      if (custom_status !== undefined) premiumFields.custom_status = custom_status?.slice(0, 255) || null;
      if (custom_status_emoji !== undefined) premiumFields.custom_status_emoji = custom_status_emoji || null;
    }

    const allFields = { ...premiumFields };
    if (bio !== undefined) allFields.bio = bio;
    if (display_name !== undefined) allFields.display_name = display_name;
    if (avatar_url !== undefined) allFields.avatar_url = avatar_url;

    if (Object.keys(allFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses = Object.keys(allFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(allFields), userId];

    await db.query(`UPDATE profiles SET ${setClauses} WHERE id = ?`, values);

    // Invalidate profile cache
    await cache.del(`profile:${userId}`);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating premium profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getProfileThemes = async (req, res) => {
  const themes = [
    { id: 'default', name: 'Default', colors: { primary: '#ef4444', bg: '#0f0f0f' }, premium: false },
    { id: 'ocean', name: 'Ocean Blue', colors: { primary: '#3b82f6', bg: '#0a0f1e' }, premium: true },
    { id: 'forest', name: 'Forest Green', colors: { primary: '#22c55e', bg: '#0a1a0f' }, premium: true },
    { id: 'sunset', name: 'Sunset Orange', colors: { primary: '#f97316', bg: '#1a0f0a' }, premium: true },
    { id: 'purple', name: 'Royal Purple', colors: { primary: '#a855f7', bg: '#0f0a1a' }, premium: true },
    { id: 'gold', name: 'Gold', colors: { primary: '#eab308', bg: '#1a1500' }, premium: true },
    { id: 'rose', name: 'Rose', colors: { primary: '#f43f5e', bg: '#1a0a0f' }, premium: true },
    { id: 'cyan', name: 'Cyber Cyan', colors: { primary: '#06b6d4', bg: '#0a1a1a' }, premium: true },
  ];
  res.json(themes);
};

// ─── Vote Streaks ─────────────────────────────────────────────────────────────

export const getVoteStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM vote_streaks WHERE user_id = ?',
      [userId]
    );
    res.json(rows[0] || { current_streak: 0, longest_streak: 0, last_vote_date: null, total_streak_bonus_xp: 0 });
  } catch (error) {
    logger.error('Error fetching vote streak:', error);
    res.status(500).json({ error: 'Failed to fetch vote streak' });
  }
};

export const updateVoteStreak = async (userId, isPremium) => {
  try {
    // Use local date (not UTC) so the day boundary matches the user's timezone
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const [rows] = await db.query('SELECT * FROM vote_streaks WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      await db.query(
        'INSERT INTO vote_streaks (user_id, current_streak, longest_streak, last_vote_date) VALUES (?, 1, 1, ?)',
        [userId, today]
      );
      return { streak: 1, bonus: isPremium ? 10 : 0 };
    }

    const streak = rows[0];
    const lastDate = streak.last_vote_date ? (() => {
      const d = new Date(streak.last_vote_date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })() : null;

    if (lastDate === today) {
      return { streak: streak.current_streak, bonus: 0 }; // Already voted today
    }

    const yest = new Date(now - 86400000);
    const yesterday = `${yest.getFullYear()}-${String(yest.getMonth()+1).padStart(2,'0')}-${String(yest.getDate()).padStart(2,'0')}`;
    const newStreak = lastDate === yesterday ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    // Streak bonus XP for premium users
    let bonusXp = 0;
    if (isPremium) {
      if (newStreak >= 100) bonusXp = 100;
      else if (newStreak >= 30) bonusXp = 50;
      else if (newStreak >= 7) bonusXp = 25;
      else if (newStreak >= 3) bonusXp = 10;
      else bonusXp = 5;
    }

    await db.query(
      `UPDATE vote_streaks SET current_streak = ?, longest_streak = ?,
       last_vote_date = ?, total_streak_bonus_xp = total_streak_bonus_xp + ?
       WHERE user_id = ?`,
      [newStreak, newLongest, today, bonusXp, userId]
    );

    // Award streak achievements (FIX #13: use top-level import, no circular dynamic import)
    if (newStreak >= 3) await awardAchievement(userId, 21);
    if (newStreak >= 7) await awardAchievement(userId, 22);
    if (newStreak >= 30) await awardAchievement(userId, 23);
    if (newStreak >= 100) await awardAchievement(userId, 24);

    return { streak: newStreak, bonus: bonusXp };
  } catch (error) {
    logger.error('Error updating vote streak:', error);
    return { streak: 0, bonus: 0 };
  }
};

// ─── XP System ───────────────────────────────────────────────────────────────

export const awardXP = async (userId, baseXp, isPremium) => {
  try {
    const xp = isPremium ? baseXp * 2 : baseXp;
    await db.query(
      `INSERT INTO user_xp (user_id, total_xp, level) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE total_xp = total_xp + ?`,
      [userId, xp, xp]
    );

    // Recalculate level (every 500 XP = 1 level)
    await db.query(
      `UPDATE user_xp SET level = GREATEST(1, FLOOR(total_xp / 500) + 1) WHERE user_id = ?`,
      [userId]
    );

    return xp;
  } catch (error) {
    logger.error('Error awarding XP:', error);
    return 0;
  }
};

export const getUserXP = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const [rows] = await db.query('SELECT * FROM user_xp WHERE user_id = ?', [userId]);
    res.json(rows[0] || { total_xp: 0, level: 1 });
  } catch (error) {
    logger.error('Error fetching user XP:', error);
    res.status(500).json({ error: 'Failed to fetch XP' });
  }
};

// ─── Friend Groups ────────────────────────────────────────────────────────────

export const createFriendGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO friend_groups (owner_id, name, color) VALUES (?, ?, ?)',
      [userId, name.trim().slice(0, 100), color || '#6366f1']
    );

    res.json({ id: result.insertId, name, color, message: 'Group created' });
  } catch (error) {
    logger.error('Error creating friend group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const getFriendGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await db.query(
      'SELECT * FROM friend_groups WHERE owner_id = ? ORDER BY created_at ASC',
      [userId]
    );

    for (const group of groups) {
      const [members] = await db.query(
        `SELECT fgm.friend_id, p.username, p.display_name, p.avatar_url
         FROM friend_group_members fgm
         JOIN profiles p ON fgm.friend_id = p.id
         WHERE fgm.group_id = ?`,
        [group.id]
      );
      group.members = members;
    }

    res.json(groups);
  } catch (error) {
    logger.error('Error fetching friend groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const addToFriendGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { friendId } = req.body;

    // Verify group ownership
    const [groups] = await db.query(
      'SELECT id FROM friend_groups WHERE id = ? AND owner_id = ?',
      [groupId, userId]
    );
    if (groups.length === 0) return res.status(404).json({ error: 'Group not found' });

    await db.query(
      'INSERT IGNORE INTO friend_group_members (group_id, friend_id) VALUES (?, ?)',
      [groupId, friendId]
    );

    res.json({ message: 'Friend added to group' });
  } catch (error) {
    logger.error('Error adding to friend group:', error);
    res.status(500).json({ error: 'Failed to add to group' });
  }
};

export const removeFromFriendGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, friendId } = req.params;

    const [groups] = await db.query(
      'SELECT id FROM friend_groups WHERE id = ? AND owner_id = ?',
      [groupId, userId]
    );
    if (groups.length === 0) return res.status(404).json({ error: 'Group not found' });

    await db.query(
      'DELETE FROM friend_group_members WHERE group_id = ? AND friend_id = ?',
      [groupId, friendId]
    );

    res.json({ message: 'Friend removed from group' });
  } catch (error) {
    logger.error('Error removing from friend group:', error);
    res.status(500).json({ error: 'Failed to remove from group' });
  }
};

export const deleteFriendGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await db.query(
      'DELETE FROM friend_groups WHERE id = ? AND owner_id = ?',
      [groupId, userId]
    );

    res.json({ message: 'Group deleted' });
  } catch (error) {
    logger.error('Error deleting friend group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

// ─── Custom Emojis ────────────────────────────────────────────────────────────

export const getCustomEmojis = async (req, res) => {
  try {
    const userId = req.user.id;
    const [emojis] = await db.query(
      'SELECT * FROM custom_emojis WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(emojis);
  } catch (error) {
    logger.error('Error fetching custom emojis:', error);
    res.status(500).json({ error: 'Failed to fetch emojis' });
  }
};

export const addCustomEmoji = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, url } = req.body;

    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });

    // Limit to 20 custom emojis
    const [count] = await db.query('SELECT COUNT(*) as c FROM custom_emojis WHERE user_id = ?', [userId]);
    if (count[0].c >= 20) return res.status(400).json({ error: 'Maximum 20 custom emojis allowed' });

    await db.query(
      'INSERT INTO custom_emojis (user_id, name, url) VALUES (?, ?, ?)',
      [userId, name.slice(0, 50), url]
    );

    res.json({ message: 'Emoji added' });
  } catch (error) {
    logger.error('Error adding custom emoji:', error);
    res.status(500).json({ error: 'Failed to add emoji' });
  }
};

export const deleteCustomEmoji = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emojiId } = req.params;

    await db.query('DELETE FROM custom_emojis WHERE id = ? AND user_id = ?', [emojiId, userId]);
    res.json({ message: 'Emoji deleted' });
  } catch (error) {
    logger.error('Error deleting custom emoji:', error);
    res.status(500).json({ error: 'Failed to delete emoji' });
  }
};

// ─── Vote History (available to all authenticated users) ─────────────────────

export const getVoteHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [votes] = await db.query(
      `SELECT v.public_id, v.voted_at, v.challenge_type_passed,
              s.name as server_name, s.slug as server_slug
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voter_user_id = ?
       ORDER BY v.voted_at DESC
       LIMIT 200`,
      [userId]
    );

    res.json({ votes, total: votes.length });
  } catch (error) {
    logger.error('Error fetching vote history:', error);
    res.status(500).json({ error: 'Failed to fetch vote history' });
  }
};

// ─── Vote History Export (premium — full history + export log) ────────────────

export const exportVoteHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [votes] = await db.query(
      `SELECT v.public_id, v.voted_at, v.challenge_type_passed,
              s.name as server_name, s.slug as server_slug
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voter_user_id = ?
       ORDER BY v.voted_at DESC`,
      [userId]
    );

    // Log export
    await db.query(
      'INSERT INTO vote_history_exports (user_id, record_count) VALUES (?, ?)',
      [userId, votes.length]
    );

    res.json({ votes, total: votes.length, exported_at: new Date().toISOString() });
  } catch (error) {
    logger.error('Error exporting vote history:', error);
    res.status(500).json({ error: 'Failed to export vote history' });
  }
};

// ─── Premium Status ───────────────────────────────────────────────────────────

export const getPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [subscription] = await db.query(
      `SELECT plan, expires_at, activated_at FROM payments
       WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    );

    const [streak] = await db.query(
      'SELECT current_streak, longest_streak, last_vote_date FROM vote_streaks WHERE user_id = ?',
      [userId]
    );

    const [xp] = await db.query(
      'SELECT total_xp, level FROM user_xp WHERE user_id = ?',
      [userId]
    );

    res.json({
      isPremium: subscription.length > 0,
      plan: subscription[0]?.plan || null,
      expiresAt: subscription[0]?.expires_at || null,
      features: subscription.length > 0 ? {
        customBadge: true,
        animatedAvatar: true,
        profileThemes: true,
        extendedBio: true,
        profileBanner: true,
        unlimitedFriends: true,
        customStatus: true,
        createGroups: true,
        voteStreakBonuses: true,
        doubleXP: true,
        exclusiveAchievements: true,
        voteHistoryExport: true,
        adFree: true,
        earlyAccess: true,
        prioritySupport: true,
        customEmojis: true,
      } : {},
      streak: streak[0] || { current_streak: 0, longest_streak: 0 },
      xp: xp[0] || { total_xp: 0, level: 1 },
    });
  } catch (error) {
    logger.error('Error fetching premium status:', error);
    res.status(500).json({ error: 'Failed to fetch premium status' });
  }
};
