-- competitions.faculty_id had no ON DELETE clause (defaults to RESTRICT),
-- blocking faculty deletion when competitions exist. Change to SET NULL.

ALTER TABLE competitions
  DROP CONSTRAINT IF EXISTS competitions_faculty_id_fkey,
  ADD CONSTRAINT competitions_faculty_id_fkey
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL;
