-- Server Owner Features

-- Server ownership claims table
CREATE TABLE IF NOT EXISTS server_ownership_claims (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  user_id CHAR(36) NOT NULL,
  proof_text TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_ownership_claims_server (server_id),
  KEY idx_ownership_claims_user (user_id),
  KEY idx_ownership_claims_status (status),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Server analytics table
CREATE TABLE IF NOT EXISTS server_analytics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  votes INT DEFAULT 0,
  UNIQUE KEY unique_server_date (server_id, date),
  KEY idx_server_analytics_server (server_id, date),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

SELECT 'Server owner features tables created successfully!' as status;
