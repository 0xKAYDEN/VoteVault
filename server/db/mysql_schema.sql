-- Conquer Top 100 MySQL Schema

-- Users table (replacing auth.users)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  username VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('player', 'server_owner', 'admin', 'vip', 'mod') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  long_description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  version VARCHAR(50),
  rate VARCHAR(50),
  region VARCHAR(50),
  exp_rate INT DEFAULT 1,
  is_online BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  status ENUM('pending', 'approved', 'rejected', 'banned') NOT NULL DEFAULT 'approved',
  vote_count INT NOT NULL DEFAULT 0,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  player_count INT NOT NULL DEFAULT 0,
  profile_visits INT NOT NULL DEFAULT 0,
  features TEXT,
  events_time TEXT,
  upcoming_updates TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_servers_vote_count ON servers (vote_count DESC);
CREATE INDEX idx_servers_status ON servers (status);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  server_id BIGINT NOT NULL,
  voter_user_id CHAR(36),
  voter_ip_hash TEXT,
  voter_user_agent TEXT,
  voter_fingerprint TEXT,
  voter_country VARCHAR(100),
  voter_city VARCHAR(100),
  challenge_type_passed VARCHAR(50),
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_votes_server ON votes (server_id, voted_at DESC);
CREATE INDEX idx_votes_user ON votes (voter_user_id, voted_at DESC);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  server_id BIGINT NOT NULL,
  user_id CHAR(36) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  owner_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  owner_id CHAR(36) NOT NULL,
  server_id BIGINT,
  key_prefix VARCHAR(50) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  last_used_at TIMESTAMP,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Site stats table
CREATE TABLE IF NOT EXISTS site_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  visits INT DEFAULT 0,
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
