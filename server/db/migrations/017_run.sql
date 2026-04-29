USE conquer_toplist;

-- profiles: add premium columns (ignore if already exist via procedure trick)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='banner_url');
SET @sql = IF(@col=0, 'ALTER TABLE profiles ADD COLUMN banner_url TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='profile_theme');
SET @sql = IF(@col=0, "ALTER TABLE profiles ADD COLUMN profile_theme VARCHAR(50) DEFAULT 'default'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='is_animated_avatar');
SET @sql = IF(@col=0, 'ALTER TABLE profiles ADD COLUMN is_animated_avatar BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='custom_status');
SET @sql = IF(@col=0, 'ALTER TABLE profiles ADD COLUMN custom_status VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='custom_status_emoji');
SET @sql = IF(@col=0, 'ALTER TABLE profiles ADD COLUMN custom_status_emoji VARCHAR(10) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- achievements: add is_premium_only column
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='achievements' AND COLUMN_NAME='is_premium_only');
SET @sql = IF(@col=0, 'ALTER TABLE achievements ADD COLUMN is_premium_only BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- vote_streaks table
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

-- user_xp table
CREATE TABLE IF NOT EXISTS user_xp (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_xp (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- friend_groups table
CREATE TABLE IF NOT EXISTS friend_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- friend_group_members table
CREATE TABLE IF NOT EXISTS friend_group_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  friend_id CHAR(36) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_group_member (group_id, friend_id),
  FOREIGN KEY (group_id) REFERENCES friend_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- custom_emojis table
CREATE TABLE IF NOT EXISTS custom_emojis (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_emoji (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- vote_history_exports table
CREATE TABLE IF NOT EXISTS vote_history_exports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  record_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Premium achievements
INSERT IGNORE INTO achievements (id, name, description, icon, rarity, is_premium_only) VALUES
  (20, 'Premium Member',  'Subscribed to VoteVault Premium',        '👑', 'legendary', TRUE),
  (21, 'Streak Starter',  'Voted 3 days in a row',                  '🔥', 'common',    FALSE),
  (22, 'On Fire',         'Voted 7 days in a row',                  '🔥', 'rare',      FALSE),
  (23, 'Unstoppable',     'Voted 30 days in a row',                 '⚡', 'epic',      FALSE),
  (24, 'Streak Legend',   'Voted 100 days in a row',                '🌟', 'legendary', TRUE),
  (25, 'XP Booster',      'Earned 1000 XP with Premium double XP', '💎', 'rare',      TRUE),
  (26, 'Group Leader',    'Created a friend group',                 '👥', 'common',    TRUE),
  (27, 'Emoji Master',    'Added 5 custom emojis',                  '😎', 'rare',      TRUE);

-- Indexes (ignore if already exist)
SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='vote_streaks' AND INDEX_NAME='idx_vote_streaks_user');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_vote_streaks_user ON vote_streaks (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='user_xp' AND INDEX_NAME='idx_user_xp_user');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_user_xp_user ON user_xp (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='friend_groups' AND INDEX_NAME='idx_friend_groups_owner');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_friend_groups_owner ON friend_groups (owner_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='custom_emojis' AND INDEX_NAME='idx_custom_emojis_user');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_custom_emojis_user ON custom_emojis (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 017 complete' AS status;
