USE conquer_toplist;

-- FIX #13: Add deleted_by_admin columns to reviews (referenced in adminController but missing)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND COLUMN_NAME='deleted_by_admin');
SET @s = IF(@c=0, 'ALTER TABLE reviews ADD COLUMN deleted_by_admin BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND COLUMN_NAME='admin_delete_reason');
SET @s = IF(@c=0, 'ALTER TABLE reviews ADD COLUMN admin_delete_reason TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #4: Unique constraint to prevent duplicate reviews per user per server
SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND INDEX_NAME='unique_user_server_review');
SET @s = IF(@i=0, 'ALTER TABLE reviews ADD UNIQUE KEY unique_user_server_review (server_id, user_id)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #26: Add plan column support for user_premium plans in payments
-- Check if plan column is ENUM and alter it to VARCHAR to support new plan names
SET @col_type = (SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='payments' AND COLUMN_NAME='plan');
SET @s = IF(@col_type LIKE 'enum%',
  "ALTER TABLE payments MODIFY COLUMN plan VARCHAR(50) NOT NULL",
  'SELECT 1'
);
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #5: Index on voter_ip_hash for cross-account detection queries
SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND INDEX_NAME='idx_votes_ip_hash');
SET @s = IF(@i=0, 'ALTER TABLE votes MODIFY COLUMN voter_ip_hash VARCHAR(64) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND INDEX_NAME='idx_votes_ip_hash');
SET @s = IF(@i=0, 'CREATE INDEX idx_votes_ip_hash ON votes (voter_ip_hash)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Add is_banned column to users if missing
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='users' AND COLUMN_NAME='is_banned');
SET @s = IF(@c=0, 'ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migration 019 complete' AS status;
