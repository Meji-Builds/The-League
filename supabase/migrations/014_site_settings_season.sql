-- Migration 014: Add current_season label to site_settings
-- Run in Supabase SQL editor — safe to re-run

alter table site_settings
  add column if not exists current_season text not null default 'Season 2026';
