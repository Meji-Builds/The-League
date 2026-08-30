-- =============================================================================
-- Migration 003: Site settings singleton (social links + livestream)
-- Run in Supabase SQL editor — safe to re-run
-- =============================================================================

create table if not exists site_settings (
  id               integer primary key default 1 check (id = 1),
  social_youtube   text,
  social_instagram text,
  social_twitter   text,
  social_tiktok    text,
  social_discord   text,
  livestream_url   text,
  livestream_title text not null default 'Live Now',
  updated_at       timestamptz,
  updated_by       uuid references auth.users(id)
);

alter table site_settings enable row level security;

drop policy if exists "Public can read site settings"  on site_settings;
drop policy if exists "Admin can manage site settings" on site_settings;

create policy "Public can read site settings"
  on site_settings for select using (true);

create policy "Admin can manage site settings"
  on site_settings for all
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
