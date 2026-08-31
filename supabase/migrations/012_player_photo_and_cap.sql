-- Add profile_picture_status column to players table
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS profile_picture_status text NOT NULL DEFAULT 'none';

-- Add max_players_per_club to fee_settings
ALTER TABLE fee_settings
  ADD COLUMN IF NOT EXISTS max_players_per_club integer NOT NULL DEFAULT 15;
