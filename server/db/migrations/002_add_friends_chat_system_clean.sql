-- Clean migration for Friends & Chat System
-- Run this if you're getting errors

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS user_online_status;

-- Friendships table (stores accepted friendships)
CREATE TABLE friendships (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id_1 CHAR(36) NOT NULL,
  user_id_2 CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship (user_id_1, user_id_2),
  FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friendships_user1 ON friendships (user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships (user_id_2);

-- Friend requests table (pending requests)
CREATE TABLE friend_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (sender_id, receiver_id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friend_requests_sender ON friend_requests (sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests (receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests (status);

-- Chat messages table
CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_sender ON chat_messages (sender_id, created_at);
CREATE INDEX idx_chat_messages_receiver ON chat_messages (receiver_id, created_at);
CREATE INDEX idx_chat_messages_conversation ON chat_messages (sender_id, receiver_id, created_at);
CREATE INDEX idx_chat_messages_unread ON chat_messages (receiver_id, is_read);

-- User online status table
CREATE TABLE user_online_status (
  user_id CHAR(36) PRIMARY KEY,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_online_status_online ON user_online_status (is_online);

SELECT 'Friends & Chat system tables created successfully!' as status;
