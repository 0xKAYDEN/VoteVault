-- Migration 029: Favorite servers + message requests
-- Run: mysql -u root -p conquer_toplist < server/db/migrations/029_add_favorites_and_message_requests.sql

-- Favorite servers
CREATE TABLE IF NOT EXISTS server_favorites (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  server_id   BIGINT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, server_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_favorites_user ON server_favorites (user_id);

-- Message requests (allow non-friends to initiate a conversation)
CREATE TABLE IF NOT EXISTS message_requests (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id   CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  message     TEXT NOT NULL,
  status      ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (sender_id, receiver_id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_msg_requests_receiver ON message_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_msg_requests_sender ON message_requests (sender_id);

SELECT 'Migration 029 complete' AS status;
