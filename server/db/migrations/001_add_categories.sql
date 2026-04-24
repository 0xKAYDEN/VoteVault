-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories (slug);
CREATE INDEX idx_categories_active ON categories (is_active, display_order);

-- Server categories junction table (many-to-many)
CREATE TABLE IF NOT EXISTS server_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (server_id, category_id),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_server_categories_server ON server_categories (server_id);
CREATE INDEX idx_server_categories_category ON server_categories (category_id);

-- Insert default categories
INSERT INTO categories (public_id, name, slug, description, icon, display_order) VALUES
  (UUID(), 'MMORPG', 'mmorpg', 'Massively Multiplayer Online Role-Playing Games', 'Swords', 1),
  (UUID(), 'Action', 'action', 'Fast-paced action and combat games', 'Zap', 2),
  (UUID(), 'PvP', 'pvp', 'Player vs Player focused servers', 'Swords', 3),
  (UUID(), 'PvE', 'pve', 'Player vs Environment focused servers', 'Shield', 4),
  (UUID(), 'Roleplay', 'roleplay', 'Roleplay and story-driven servers', 'Users', 5),
  (UUID(), 'Survival', 'survival', 'Survival and crafting focused games', 'Mountain', 6),
  (UUID(), 'Sandbox', 'sandbox', 'Open world sandbox games', 'Box', 7),
  (UUID(), 'Fantasy', 'fantasy', 'Fantasy themed games and servers', 'Sparkles', 8),
  (UUID(), 'Sci-Fi', 'sci-fi', 'Science fiction themed servers', 'Rocket', 9),
  (UUID(), 'Medieval', 'medieval', 'Medieval themed servers', 'Castle', 10),
  (UUID(), 'Anime', 'anime', 'Anime styled games and servers', 'Star', 11),
  (UUID(), 'Hardcore', 'hardcore', 'Hardcore difficulty servers', 'Skull', 12),
  (UUID(), 'Casual', 'casual', 'Casual and relaxed gameplay', 'Coffee', 13),
  (UUID(), 'High Rate', 'high-rate', 'High experience and drop rates', 'TrendingUp', 14),
  (UUID(), 'Low Rate', 'low-rate', 'Low rates, classic experience', 'TrendingDown', 15),
  (UUID(), 'Custom', 'custom', 'Custom content and modifications', 'Wrench', 16),
  (UUID(), 'Classic', 'classic', 'Classic/Vanilla gameplay', 'Clock', 17),
  (UUID(), 'Free to Play', 'free-to-play', 'Completely free to play servers', 'DollarSign', 18),
  (UUID(), 'International', 'international', 'International multi-language servers', 'Globe', 19),
  (UUID(), 'Conquer Online', 'conquer-online', 'Conquer Online private servers', 'Crown', 20);
