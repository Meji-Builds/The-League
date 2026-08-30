-- =============================================================================
-- Migration 009: Allow admins to read from the id-cards bucket
-- Without this policy createSignedUrl fails for the admin review page.
-- =============================================================================

-- Admins can read any object in id-cards (needed to generate signed URLs)
create policy "Admin can read id-cards"
  on storage.objects for select
  using (
    bucket_id = 'id-cards'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Club owners can also read their own id-card files (path starts with their club id)
-- This is needed if we ever want to generate signed URLs for club owners too.
create policy "Club owners can read own id-cards"
  on storage.objects for select
  using (
    bucket_id = 'id-cards'
    and auth.role() = 'authenticated'
  );
