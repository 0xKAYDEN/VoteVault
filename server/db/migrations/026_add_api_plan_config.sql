-- Migration 026: API Plan Configuration Table
-- Allows admin to control API rate limits per plan without redeploying
-- Run: mysql -u root -p conquer_toplist < server/db/migrations/026_add_api_plan_config.sql

CREATE TABLE IF NOT EXISTS api_plan_config (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_name     VARCHAR(50)  NOT NULL UNIQUE,
  daily_limit   INT          NULL COMMENT 'NULL = unlimited',
  per_minute    INT          NOT NULL DEFAULT 10,
  server_limit  INT          NULL COMMENT 'NULL = unlimited',
  price_monthly DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  price_yearly  DECIMAL(8,2) NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed with current plan values
INSERT INTO api_plan_config (plan_name, daily_limit, per_minute, server_limit, price_monthly) VALUES
  ('free',       500,   10,   2,    0.00),
  ('starter',    5000,  60,   5,    4.99),
  ('pro',        50000, 300,  15,   14.99),
  ('enterprise', NULL,  1000, NULL, 39.99)
ON DUPLICATE KEY UPDATE
  daily_limit   = VALUES(daily_limit),
  per_minute    = VALUES(per_minute),
  server_limit  = VALUES(server_limit),
  price_monthly = VALUES(price_monthly);
