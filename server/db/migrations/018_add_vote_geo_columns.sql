USE conquer_toplist;

-- Add richer geo columns to votes table (safe idempotent pattern)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND COLUMN_NAME='voter_country_code');
SET @s = IF(@c=0, 'ALTER TABLE votes ADD COLUMN voter_country_code VARCHAR(10) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND COLUMN_NAME='voter_region');
SET @s = IF(@c=0, 'ALTER TABLE votes ADD COLUMN voter_region VARCHAR(150) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND COLUMN_NAME='voter_isp');
SET @s = IF(@c=0, 'ALTER TABLE votes ADD COLUMN voter_isp VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND COLUMN_NAME='voter_lat');
SET @s = IF(@c=0, 'ALTER TABLE votes ADD COLUMN voter_lat DECIMAL(9,6) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND COLUMN_NAME='voter_lon');
SET @s = IF(@c=0, 'ALTER TABLE votes ADD COLUMN voter_lon DECIMAL(9,6) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Index for geo queries
SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='votes' AND INDEX_NAME='idx_votes_country');
SET @s = IF(@i=0, 'CREATE INDEX idx_votes_country ON votes (voter_country)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migration 018 complete' AS status;
