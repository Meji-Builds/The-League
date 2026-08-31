-- Faculties: top-level grouping for league navigation
create table if not exists faculties (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text not null unique,
  logo_url      text,
  display_order int  not null default 0,
  created_at    timestamptz not null default now()
);

-- Divisions within each faculty (with optional logos)
create table if not exists faculty_divisions (
  id            uuid primary key default gen_random_uuid(),
  faculty_id    uuid not null references faculties(id) on delete cascade,
  name          text not null,
  slug          text not null,
  logo_url      text,
  display_order int  not null default 0,
  unique(faculty_id, slug)
);

-- Link competitions to their owning faculty
alter table competitions add column if not exists faculty_id uuid references faculties(id);

-- RLS: public read, admin write
alter table faculties enable row level security;
create policy "Anyone can view faculties"
  on faculties for select using (true);
create policy "Admins can manage faculties"
  on faculties for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter table faculty_divisions enable row level security;
create policy "Anyone can view faculty_divisions"
  on faculty_divisions for select using (true);
create policy "Admins can manage faculty_divisions"
  on faculty_divisions for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
