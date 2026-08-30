-- Lineup graphics uploaded by admin for each fixture, shown on the public fixture detail page

alter table fixtures
  add column if not exists lineup_image_a text,
  add column if not exists lineup_image_b text;
