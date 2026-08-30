-- =============================================================================
-- Migration 002: Make department optional, add player ID card verification
-- Run this in your Supabase SQL editor
-- =============================================================================

alter table clubs alter column department drop not null;

alter table players
  add column if not exists id_card_url    text,
  add column if not exists id_card_status text not null default 'pending';

-- Drop policies before recreating to allow re-running this migration safely.
drop policy if exists "Admin can manage all clubs"          on clubs;
drop policy if exists "Admin can manage all players"        on players;
drop policy if exists "Admin can manage competitions"       on competitions;
drop policy if exists "Admin can manage fixtures"           on fixtures;
drop policy if exists "Admin can manage fee settings"       on fee_settings;
drop policy if exists "Admin can manage competition entries" on competition_entries;

create policy "Admin can manage all clubs"
  on clubs for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

create policy "Admin can manage all players"
  on players for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

create policy "Admin can manage competitions"
  on competitions for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

create policy "Admin can manage fixtures"
  on fixtures for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

create policy "Admin can manage fee settings"
  on fee_settings for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

create policy "Admin can manage competition entries"
  on competition_entries for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );
