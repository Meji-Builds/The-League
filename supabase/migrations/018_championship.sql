-- Tracks the top-2 clubs promoted from each division to the University Championship
create table if not exists division_promotions (
  id           uuid primary key default gen_random_uuid(),
  division_id  uuid not null references faculty_divisions(id) on delete cascade,
  club_id      uuid not null references clubs(id) on delete cascade,
  position     int  not null check (position in (1, 2)),
  season       text not null,
  promoted_at  timestamptz not null default now(),
  unique(division_id, position, season),
  unique(division_id, club_id, season)
);

alter table division_promotions enable row level security;

create policy "Anyone can view division_promotions"
  on division_promotions for select using (true);

create policy "Admins can manage division_promotions"
  on division_promotions for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
