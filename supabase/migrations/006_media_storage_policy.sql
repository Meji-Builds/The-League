-- =============================================================================
-- Media Storage Bucket Policies
-- Applies to the "media" bucket (public) used for admin-uploaded images:
--   announcements/, highlights/, sponsors/
--
-- Prerequisites: create the "media" bucket in Supabase Storage dashboard
--   (Storage → New bucket → name: media, public: ON)
-- =============================================================================

-- Anyone can read (bucket is public, but this policy is still needed for RLS)
create policy "Public can view media"
  on storage.objects for select
  using (bucket_id = 'media');

-- Only admins can upload
create policy "Admin can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can replace / overwrite
create policy "Admin can update media"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can delete
create policy "Admin can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
