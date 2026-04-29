-- Track per-user daily API quota in DB so it survives Redis restarts
ALTER TABLE profiles
  ADD COLUMN api_daily_used     INT          NOT NULL DEFAULT 0,
  ADD COLUMN api_daily_date     DATE         NULL,
  ADD COLUMN api_total_requests BIGINT       NOT NULL DEFAULT 0;

-- Daily request log for the activity chart (one row per user per day)
CREATE TABLE IF NOT EXISTS api_request_log (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(36)  NOT NULL,
  log_date      DATE         NOT NULL,
  request_count INT          NOT NULL DEFAULT 0,
  UNIQUE KEY uq_user_date (user_id, log_date),
  INDEX idx_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
