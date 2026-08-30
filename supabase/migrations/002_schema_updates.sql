-- =============================================================================
-- Migration 002: Make department optional, add player ID card verification
-- Run this in your Supabase SQL editor
-- =============================================================================

-- Make department optional on clubs
alter table clubs alter column department drop not null;

-- Add ID card fields to players
alter table players
  add column if not exists id_card_url  text,
  add column if not exists id_card_status text not null default 'pending';

-- Create storage bucket for player ID card images (run this separately in
-- the Supabase dashboard: Storage > New bucket, name "id-cards", public = true)
-- Then add storage policies:
--   INSERT: authenticated users can upload (use bucket_id = 'id-cards' and auth.role() = 'authenticated')
--   SELECT: public can read (always true)

-- Allow admins to approve/suspend any club
create policy "Admin can manage all clubs"
  on clubs for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- Allow admins to manage all players (for ID card verification)
create policy "Admin can manage all players"
  on players for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- Allow admins to create and manage competitions
create policy "Admin can manage competitions"
  on competitions for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- Allow admins to create and manage fixtures
create policy "Admin can manage fixtures"
  on fixtures for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- Allow admins to manage fee settings
create policy "Admin can manage fee settings"
  on fee_settings for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- Allow admins to manage competition entries
create policy "Admin can manage competition entries"
  on competition_entries for all using (
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );
