-- =============================================================================
-- Clubs Storage Bucket Policies
-- Applies to the "clubs" bucket (public) used for club-uploaded images:
--   logos and badge/cover photos, stored under {club_id}/...
--
-- Prerequisites: create the "clubs" bucket in Supabase Storage dashboard
--   (Storage → New bucket → name: clubs, public: ON)
-- =============================================================================

-- Anyone can view (bucket is public)
create policy "Public can view club media"
  on storage.objects for select
  using (bucket_id = 'clubs');

-- Authenticated club owners can upload their own club media
create policy "Club owners can upload club media"
  on storage.objects for insert
  with check (
    bucket_id = 'clubs'
    and auth.role() = 'authenticated'
  );

-- Authenticated club owners can replace existing uploads
create policy "Club owners can update club media"
  on storage.objects for update
  using (
    bucket_id = 'clubs'
    and auth.role() = 'authenticated'
  );

-- Admins can delete club media
create policy "Admin can delete club media"
  on storage.objects for delete
  using (
    bucket_id = 'clubs'
    and (
      auth.role() = 'authenticated'
      and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );
