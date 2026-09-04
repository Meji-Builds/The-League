-- =============================================================================
-- Migration 023: Invite-gated registration system
-- =============================================================================

-- 1. Registration toggle on site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS registration_enabled boolean NOT NULL DEFAULT true;

-- 2. Test-mode flag on clubs
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- 3. Registration invites table
CREATE TABLE IF NOT EXISTS registration_invites (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token               text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  -- Details collected from the prospective tester offline (WhatsApp etc.)
  expected_name       text NOT NULL,
  expected_club_name  text NOT NULL,
  expected_email      text,
  note                text,
  -- Lifecycle
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at             timestamptz,
  used_by_user_id     uuid REFERENCES auth.users(id),
  -- pending | used | approved | rejected | revoked
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'used', 'approved', 'rejected', 'revoked'))
);

ALTER TABLE registration_invites ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admin full access invites"
  ON registration_invites FOR ALL
  USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Authenticated users can read their own used invite
-- (needed so setupClub can detect is_test without service role)
CREATE POLICY "Users can read own invite"
  ON registration_invites FOR SELECT
  USING (used_by_user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_invites_token  ON registration_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON registration_invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_user   ON registration_invites(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_is_test  ON clubs(is_test);
