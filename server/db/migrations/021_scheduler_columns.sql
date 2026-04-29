USE conquer_toplist;

-- Expiry warning flag on payments
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='payments' AND COLUMN_NAME='expiry_warned');
SET @s = IF(@c=0, 'ALTER TABLE payments ADD COLUMN expiry_warned BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Monthly vote tracking columns on servers
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='vote_count_alltime');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN vote_count_alltime INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='vote_count_monthly');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN vote_count_monthly INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Seed alltime from current vote_count
UPDATE servers SET vote_count_alltime = vote_count WHERE vote_count_alltime = 0;

SELECT 'Migration 021 complete' AS status;
