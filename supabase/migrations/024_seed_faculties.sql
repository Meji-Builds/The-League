-- Seed the four starting faculties.
-- Uses INSERT ... ON CONFLICT DO NOTHING so re-running is safe.
INSERT INTO faculties (name, short_name, slug, display_order)
VALUES
  ('Faculty of Science',            'FOS',   'fos',   1),
  ('Faculty of Social Science',     'SOSSA', 'sossa', 2),
  ('Faculty of Arts',               'FASA',  'fasa',  3),
  ('Faculty of Management Science', 'FAMS',  'fams',  4)
ON CONFLICT (slug) DO NOTHING;
