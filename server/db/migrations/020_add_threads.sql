USE conquer_toplist;

CREATE TABLE IF NOT EXISTS thread_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10) DEFAULT '💬',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT IGNORE INTO thread_categories (id, name, slug, description, icon, display_order) VALUES
  (1, 'General',        'general',        'Talk about anything',                    '💬', 1),
  (2, 'Game Discussion','game-discussion', 'Discuss your favourite games & servers', '🎮', 2),
  (3, 'Server Reviews', 'server-reviews',  'Share your server experiences',          '⭐', 3),
  (4, 'Help & Support', 'help-support',    'Ask questions and get help',             '🆘', 4),
  (5, 'Announcements',  'announcements',   'Official announcements',                 '📢', 5),
  (6, 'Off-Topic',      'off-topic',       'Anything goes',                          '🎲', 6);

CREATE TABLE IF NOT EXISTS threads (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  author_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reply_user_id CHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES thread_categories(id),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (last_reply_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS thread_replies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  thread_id BIGINT NOT NULL,
  author_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS thread_reactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  target_type ENUM('thread','reply') NOT NULL,
  target_id BIGINT NOT NULL,
  reaction VARCHAR(10) NOT NULL DEFAULT '👍',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (user_id, target_type, target_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_threads_category ON threads (category_id, is_deleted, last_reply_at DESC);
CREATE INDEX idx_threads_author ON threads (author_id);
CREATE INDEX idx_thread_replies_thread ON thread_replies (thread_id, is_deleted, created_at ASC);
CREATE INDEX idx_thread_reactions_target ON thread_reactions (target_type, target_id);

SELECT 'Migration 020 complete' AS status;
