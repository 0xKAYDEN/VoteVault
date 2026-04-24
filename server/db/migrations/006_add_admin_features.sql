-- Admin Features: User Management, Content Moderation

-- User bans/suspensions table
CREATE TABLE IF NOT EXISTS user_bans (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  admin_id CHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  ban_type ENUM('temporary', 'permanent') NOT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_bans_user (user_id),
  KEY idx_user_bans_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add is_banned flag to users table (ignore if exists)
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- Add deleted_by_admin to reviews (ignore if exists)
ALTER TABLE reviews
  ADD COLUMN deleted_by_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN admin_delete_reason TEXT;

SELECT 'Admin features tables created successfully!' as status;
