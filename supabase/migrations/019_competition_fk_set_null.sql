-- Drop and re-add nullable FKs with ON DELETE SET NULL so deleting a
-- competition automatically clears the reference rather than blocking.

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_competition_id_fkey,
  ADD CONSTRAINT payments_competition_id_fkey
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL;

ALTER TABLE highlights
  DROP CONSTRAINT IF EXISTS highlights_competition_id_fkey,
  ADD CONSTRAINT highlights_competition_id_fkey
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL;
