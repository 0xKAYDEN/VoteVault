USE conquer_toplist;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='youtube_url');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN youtube_url TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='facebook_url');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN facebook_url TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='twitter_url');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN twitter_url TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='servers' AND COLUMN_NAME='twitch_url');
SET @s = IF(@c=0, 'ALTER TABLE servers ADD COLUMN twitch_url TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migration 022 complete' AS status;
