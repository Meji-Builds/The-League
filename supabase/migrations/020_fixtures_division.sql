-- Link fixtures to a specific faculty division so standings group correctly.
ALTER TABLE fixtures
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES faculty_divisions(id) ON DELETE SET NULL;
