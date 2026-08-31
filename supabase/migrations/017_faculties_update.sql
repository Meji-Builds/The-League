-- Add short_name abbreviation to faculties (e.g. "FOS" for "Faculty of Science")
alter table faculties add column if not exists short_name text not null default '';

-- Division-club assignment join table
create table if not exists division_clubs (
  id          uuid primary key default gen_random_uuid(),
  division_id uuid not null references faculty_divisions(id) on delete cascade,
  club_id     uuid not null references clubs(id) on delete cascade,
  unique(division_id, club_id)
);

alter table division_clubs enable row level security;
create policy "Anyone can view division_clubs"
  on division_clubs for select using (true);
create policy "Admins can manage division_clubs"
  on division_clubs for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
