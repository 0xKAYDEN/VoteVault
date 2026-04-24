-- Email Notifications System

-- Add email notification preferences to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_friend_requests BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_reviews BOOLEAN DEFAULT TRUE;

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM('friend_request', 'message', 'review', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read);

SELECT 'Email notifications system tables created successfully!' as status;
