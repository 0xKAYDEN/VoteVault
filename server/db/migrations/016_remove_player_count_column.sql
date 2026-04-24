-- Remove redundant player_count column, keep only active_players
-- First copy any data from player_count to active_players if needed
UPDATE servers SET active_players = player_count WHERE active_players = 0 AND player_count > 0;

-- Drop the redundant column
ALTER TABLE servers DROP COLUMN player_count;
