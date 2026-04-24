-- Server Enhancement Features: Tags, Favorites, Comparison

-- Server tags table
CREATE TABLE IF NOT EXISTS server_tags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_server_tag (server_id, tag),
  KEY idx_server_tags_tag (tag),
  KEY idx_server_tags_server (server_id),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  server_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_favorite (user_id, server_id),
  KEY idx_user_favorites_user (user_id),
  KEY idx_user_favorites_server (server_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Server changelog/updates table
CREATE TABLE IF NOT EXISTS server_updates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_server_updates_server (server_id, created_at),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Add favorites count to servers (ignore if exists)
ALTER TABLE servers ADD COLUMN favorites_count INT DEFAULT 0;

SELECT 'Server enhancement features tables created successfully!' as status;
