-- Simple step-by-step migration
-- Copy and paste each section into your MySQL client

-- Step 1: Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id_1 CHAR(36) NOT NULL,
  user_id_2 CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship (user_id_1, user_id_2),
  KEY idx_friendships_user1 (user_id_1),
  KEY idx_friendships_user2 (user_id_2),
  FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (sender_id, receiver_id),
  KEY idx_friend_requests_sender (sender_id),
  KEY idx_friend_requests_receiver (receiver_id),
  KEY idx_friend_requests_status (status),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_messages_sender (sender_id, created_at),
  KEY idx_chat_messages_receiver (receiver_id, created_at),
  KEY idx_chat_messages_unread (receiver_id, is_read),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 4: Create user_online_status table
CREATE TABLE IF NOT EXISTS user_online_status (
  user_id CHAR(36) PRIMARY KEY,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_online_status_online (is_online),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 5: Add 2FA columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT DEFAULT NULL;

-- Verify tables were created
SELECT 'All tables created successfully!' AS status;
SHOW TABLES LIKE '%friend%';
SHOW TABLES LIKE '%chat%';
SHOW TABLES LIKE '%online%';
