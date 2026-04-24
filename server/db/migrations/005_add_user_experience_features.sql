-- User Experience Features: Block, Report, Search

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  blocker_id CHAR(36) NOT NULL,
  blocked_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  KEY idx_blocked_users_blocker (blocker_id),
  KEY idx_blocked_users_blocked (blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id CHAR(36) NOT NULL,
  reported_type ENUM('user', 'server', 'review') NOT NULL,
  reported_id VARCHAR(255) NOT NULL,
  reason ENUM('spam', 'harassment', 'inappropriate', 'cheating', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_reports_reporter (reporter_id),
  KEY idx_reports_status (status),
  KEY idx_reports_type (reported_type, reported_id),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

SELECT 'User experience features tables created successfully!' as status;
