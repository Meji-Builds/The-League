-- =============================================================================
-- Admin RLS Policies
-- Grants full write access to users whose JWT app_metadata.role = 'admin'
-- =============================================================================

-- Helper: returns true when the calling user is an admin
-- (app_metadata is set server-side in the Supabase Auth dashboard and cannot
-- be forged by a client token)

-- Announcements
create policy "Admin can insert announcements"
  on announcements for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update announcements"
  on announcements for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete announcements"
  on announcements for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Highlights
create policy "Admin can insert highlights"
  on highlights for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update highlights"
  on highlights for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete highlights"
  on highlights for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Global Sponsors
create policy "Admin can insert global_sponsors"
  on global_sponsors for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update global_sponsors"
  on global_sponsors for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete global_sponsors"
  on global_sponsors for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Competitions (create / edit / delete)
create policy "Admin can insert competitions"
  on competitions for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update competitions"
  on competitions for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete competitions"
  on competitions for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Competition entries (admin can add/remove clubs from competitions)
create policy "Admin can insert competition_entries"
  on competition_entries for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update competition_entries"
  on competition_entries for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete competition_entries"
  on competition_entries for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fixtures (create / edit / confirm scores)
create policy "Admin can insert fixtures"
  on fixtures for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update fixtures"
  on fixtures for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete fixtures"
  on fixtures for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clubs (approve / suspend)
create policy "Admin can read all clubs"
  on clubs for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update clubs"
  on clubs for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete clubs"
  on clubs for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Club owners (admin can read all owners)
create policy "Admin can read all club_owners"
  on club_owners for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Players (approve / reject ID cards)
create policy "Admin can read all players"
  on players for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update players"
  on players for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can delete players"
  on players for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fee settings
create policy "Admin can upsert fee_settings"
  on fee_settings for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update fee_settings"
  on fee_settings for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Site settings
create policy "Admin can upsert site_settings"
  on site_settings for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin can update site_settings"
  on site_settings for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Payments (admin can read all)
create policy "Admin can read all payments"
  on payments for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
