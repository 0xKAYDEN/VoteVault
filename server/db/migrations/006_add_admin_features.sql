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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans (user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_expires ON user_bans (expires_at);

-- Add is_banned flag to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add deleted_by_admin to reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS deleted_by_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_delete_reason TEXT;

SELECT 'Admin features tables created successfully!' as status;
