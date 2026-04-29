-- Migration 027: App Settings table (kill switches, feature flags)
-- Run: mysql -u root -p conquer_toplist < server/db/migrations/027_add_app_settings.sql

CREATE TABLE IF NOT EXISTS app_settings (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key  VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT        NOT NULL DEFAULT '',
  updated_by   VARCHAR(36)  NULL,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default: payments enabled
INSERT INTO app_settings (setting_key, setting_value) VALUES ('payments_enabled', 'true')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
