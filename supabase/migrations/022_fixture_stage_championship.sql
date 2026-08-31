-- Add championship-round stage values to the fixture_stage enum
ALTER TYPE fixture_stage ADD VALUE IF NOT EXISTS 'Group';
ALTER TYPE fixture_stage ADD VALUE IF NOT EXISTS 'Round of 16';
ALTER TYPE fixture_stage ADD VALUE IF NOT EXISTS 'Quarter-final';
ALTER TYPE fixture_stage ADD VALUE IF NOT EXISTS 'Semi-final';
ALTER TYPE fixture_stage ADD VALUE IF NOT EXISTS 'Final';
