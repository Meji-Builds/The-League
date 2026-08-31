-- Migration 015: Extend site_settings with all editable page content
-- Run in Supabase SQL editor — safe to re-run (add column if not exists)

alter table site_settings
  -- Site identity
  add column if not exists site_name                text not null default 'The League',

  -- Homepage bottom CTA
  add column if not exists home_cta_eyebrow         text not null default 'Join The League',
  add column if not exists home_cta_headline        text not null default 'Represent Your University',
  add column if not exists home_cta_description     text not null default 'Register your club, compete for your department and faculty, and represent your university at the championship level.',
  add column if not exists home_cta_primary_btn     text not null default 'Register Your Club',
  add column if not exists home_cta_secondary_link  text not null default 'Sponsor The League',

  -- Page descriptions / eyebrow labels
  add column if not exists competitions_description text not null default 'Multiple competitions run concurrently — from the flagship University Championship to standalone cups.',
  add column if not exists highlights_description   text not null default 'Match VODs and moments from the season.',
  add column if not exists standings_description    text not null default 'Updated after every confirmed result.',
  add column if not exists fixtures_eyebrow         text not null default 'Schedule & Results',

  -- Empty-state messages
  add column if not exists empty_competitions_heading text not null default 'Season 1 is getting ready.',
  add column if not exists empty_competitions_text    text not null default 'Competitions will appear here once registration opens.',
  add column if not exists empty_live_heading         text not null default 'No live streams right now.',
  add column if not exists empty_live_text            text not null default 'Check back during scheduled match days.',

  -- Sponsors page
  add column if not exists sponsorship_email        text not null default 'sponsorship@theleague.ng',
  add column if not exists sponsors_description     text not null default 'The League is the official governing body for university esports. We run structured competitions across departments, faculties, and the university — with a growing audience of students, alumni, and fans.',
  add column if not exists sponsors_cta_description text not null default 'We work with sponsors to build custom packages that fit your goals. Reach out and we will put together a proposal.',

  -- Sponsorship tier names + descriptions
  add column if not exists tier_title_name         text not null default 'Title Sponsor',
  add column if not exists tier_title_description  text not null default 'Full naming rights to the season. Maximum logo placement across all competition materials, streams, and digital surfaces.',
  add column if not exists tier_gold_name          text not null default 'Gold Partner',
  add column if not exists tier_gold_description   text not null default 'Premium placement on fixtures, standings, and the club directory. Named in all official communications.',
  add column if not exists tier_silver_name        text not null default 'Silver Partner',
  add column if not exists tier_silver_description text not null default 'Logo placement on the public site and match day materials. Named in season announcements.',
  add column if not exists tier_bronze_name        text not null default 'Bronze Partner',
  add column if not exists tier_bronze_description text not null default 'Logo on the sponsors page and acknowledgement in season communications.';
