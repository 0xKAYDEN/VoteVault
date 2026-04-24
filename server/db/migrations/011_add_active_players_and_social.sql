-- Add active players tracking to servers
ALTER TABLE servers
  ADD COLUMN active_players INT DEFAULT 0,
  ADD COLUMN last_active_update DATETIME;

-- Add social media links to profiles
ALTER TABLE profiles
  ADD COLUMN social_discord VARCHAR(255),
  ADD COLUMN social_twitter VARCHAR(255),
  ADD COLUMN social_youtube VARCHAR(255),
  ADD COLUMN social_twitch VARCHAR(255),
  ADD COLUMN social_website VARCHAR(255);

-- Add theme preference (already in user_preferences from migration 009, but ensure it exists)
-- This is a safety check in case migration 009 wasn't run

-- Add premium features to users table
ALTER TABLE users
  ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN premium_expires_at DATETIME;

-- Add premium features to servers
ALTER TABLE servers
  ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN premium_expires_at DATETIME;
