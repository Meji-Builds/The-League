-- =============================================================================
-- Migration 008: Livestreams table
-- Replaces the single livestream_url / livestream_title columns in site_settings
-- with a proper multi-stream table.
-- =============================================================================

create table livestreams (
  id         uuid        primary key default gen_random_uuid(),
  url        text        not null,
  title      text        not null default 'Live Now',
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

alter table livestreams enable row level security;

-- Anyone can read active streams
create policy "Public can read active livestreams"
  on livestreams for select
  using (is_active = true);

-- Admins can insert
create policy "Admin can insert livestreams"
  on livestreams for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admins can update
create policy "Admin can update livestreams"
  on livestreams for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admins can delete
create policy "Admin can delete livestreams"
  on livestreams for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
