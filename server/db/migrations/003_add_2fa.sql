-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT DEFAULT NULL;
