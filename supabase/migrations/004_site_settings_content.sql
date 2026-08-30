-- Extend site_settings with platform content fields
-- Run in your Supabase SQL editor

alter table site_settings
  add column if not exists about_text     text,
  add column if not exists contact_email  text,
  add column if not exists hero_title     text not null default 'University Esports, Officially Organized.',
  add column if not exists hero_subtitle  text not null default 'The League governs university esports competitions — from department qualifiers to the University Championship final.';
