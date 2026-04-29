USE conquer_toplist;

-- FIX #13: Add deleted_by_admin columns to reviews
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND COLUMN_NAME='deleted_by_admin');
SET @s = IF(@c=0, 'ALTER TABLE reviews ADD COLUMN deleted_by_admin BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND COLUMN_NAME='admin_delete_reason');
SET @s = IF(@c=0, 'ALTER TABLE reviews ADD COLUMN admin_delete_reason TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #4: Remove duplicate reviews first (keep the most recent per user+server), then add unique constraint
DELETE r1 FROM reviews r1
INNER JOIN reviews r2
WHERE r1.server_id = r2.server_id
  AND r1.user_id = r2.user_id
  AND r1.created_at < r2.created_at;

SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='reviews' AND INDEX_NAME='unique_user_server_review');
SET @s = IF(@i=0, 'ALTER TABLE reviews ADD UNIQUE KEY unique_user_server_review (server_id, user_id)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #26: Widen plan column to VARCHAR to support user_premium plan names
ALTER TABLE payments MODIFY COLUMN plan VARCHAR(50) NOT NULL;

-- FIX #5: Change voter_ip_hash from TEXT to VARCHAR(64) so it can be indexed
ALTER TABLE votes MODIFY COLUMN voter_ip_hash VARCHAR(64) DEFAULT NULL;

SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND INDEX_NAME='idx_votes_ip_hash');
SET @s = IF(@i=0, 'CREATE INDEX idx_votes_ip_hash ON votes (voter_ip_hash)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FIX #1: Ensure is_banned column exists on users
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='users' AND COLUMN_NAME='is_banned');
SET @s = IF(@c=0, 'ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migration 019 v2 complete' AS status;
