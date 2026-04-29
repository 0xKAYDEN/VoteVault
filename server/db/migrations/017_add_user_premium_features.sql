-- Migration 017: Add User Premium Features
-- Compatible with MySQL 5.7+

-- Add premium columns to profiles table (run each separately to handle existing columns)
ALTER TABLE profiles ADD COLUMN banner_url TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN profile_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN is_animated_avatar BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN custom_status VARCHAR(255) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN custom_status_emoji VARCHAR(10) DEFAULT NULL;

-- Vote streaks table
CREATE TABLE IF NOT EXISTS vote_streaks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_vote_date DATE DEFAULT NULL,
  total_streak_bonus_xp INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_streak (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User XP table
CREATE TABLE IF NOT EXISTS user_xp (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_xp (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friend groups table
CREATE TABLE IF NOT EXISTS friend_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friend group members
CREATE TABLE IF NOT EXISTS friend_group_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  friend_id CHAR(36) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_group_member (group_id, friend_id),
  FOREIGN KEY (group_id) REFERENCES friend_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom emojis table
CREATE TABLE IF NOT EXISTS custom_emojis (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_emoji (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Vote history export log
CREATE TABLE IF NOT EXISTS vote_history_exports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  record_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add is_premium_only column to achievements
ALTER TABLE achievements ADD COLUMN is_premium_only BOOLEAN DEFAULT FALSE;

-- Insert premium achievements
INSERT IGNORE INTO achievements (id, name, description, icon, rarity, is_premium_only) VALUES
  (20, 'Premium Member',  'Subscribed to VoteVault Premium',        '👑', 'legendary', TRUE),
  (21, 'Streak Starter',  'Voted 3 days in a row',                  '🔥', 'common',    FALSE),
  (22, 'On Fire',         'Voted 7 days in a row',                  '🔥', 'rare',      FALSE),
  (23, 'Unstoppable',     'Voted 30 days in a row',                 '⚡', 'epic',      FALSE),
  (24, 'Streak Legend',   'Voted 100 days in a row',                '🌟', 'legendary', TRUE),
  (25, 'XP Booster',      'Earned 1000 XP with Premium double XP', '💎', 'rare',      TRUE),
  (26, 'Group Leader',    'Created a friend group',                 '👥', 'common',    TRUE),
  (27, 'Emoji Master',    'Added 5 custom emojis',                  '😎', 'rare',      TRUE);

-- Indexes
CREATE INDEX idx_vote_streaks_user    ON vote_streaks    (user_id);
CREATE INDEX idx_user_xp_user         ON user_xp         (user_id);
CREATE INDEX idx_friend_groups_owner  ON friend_groups   (owner_id);
CREATE INDEX idx_custom_emojis_user   ON custom_emojis   (user_id);
