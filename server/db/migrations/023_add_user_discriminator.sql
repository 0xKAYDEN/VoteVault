USE conquer_toplist;

-- Add a short numeric discriminator (like Discord's #1234) to profiles
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND COLUMN_NAME='discriminator');
SET @s = IF(@c=0, 'ALTER TABLE profiles ADD COLUMN discriminator SMALLINT UNSIGNED NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Generate random 4-digit discriminators for existing users
UPDATE profiles SET discriminator = FLOOR(1000 + RAND() * 9000) WHERE discriminator = 0;

-- Add index for search by username+discriminator
SET @i = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='conquer_toplist' AND TABLE_NAME='profiles' AND INDEX_NAME='idx_profiles_username_disc');
SET @s = IF(@i=0, 'CREATE INDEX idx_profiles_username_disc ON profiles (username, discriminator)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migration 023 complete' AS status;
