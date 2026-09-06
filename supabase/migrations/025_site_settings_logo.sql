-- Add logo_url column to site_settings for platform logo upload.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url text;
