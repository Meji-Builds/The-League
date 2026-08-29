-- =============================================================================
-- The League — Initial Schema
-- Run this in your Supabase SQL editor or via `supabase db push`
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ --
-- ENUMS
-- ------------------------------------------------------------------ --

create type club_status as enum ('pending', 'approved', 'suspended');
create type competition_type as enum ('flagship', 'cup', 'other');
create type competition_cycle as enum ('biennial', 'annual', 'one-off');
create type competition_format as enum ('funnel_pyramid', 'knockout', 'group_stage', 'league');
create type competition_status as enum ('upcoming', 'registration_open', 'in_progress', 'completed');
create type fixture_stage as enum ('Department', 'Faculty', 'University', 'N/A');
create type fixture_status as enum ('scheduled', 'reported', 'disputed', 'confirmed');
create type payment_type as enum ('owner_registration', 'competition_entry');
create type payment_status as enum ('pending', 'success', 'failed');
create type payment_entry_status as enum ('unpaid', 'paid');
create type sponsor_tier as enum ('title', 'gold', 'silver', 'bronze');

-- ------------------------------------------------------------------ --
-- CLUBS
-- ------------------------------------------------------------------ --

create table clubs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text not null unique,
  logo_url      text,
  badge_url     text,
  department    text not null,
  faculty       text not null,
  owner_id      uuid not null, -- references auth.users
  bio           text,
  status        club_status not null default 'pending',
  merch         jsonb not null default '[]',
  sponsors      jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------ --
-- CLUB OWNERS
-- (one record per owner, linked to auth.users via user_id)
-- ------------------------------------------------------------------ --

create table club_owners (
  id                                  uuid primary key default gen_random_uuid(),
  user_id                             uuid not null unique references auth.users(id) on delete cascade,
  name                                text not null,
  email                               text not null unique,
  phone                               text,
  owner_registration_payment_status   payment_entry_status not null default 'unpaid',
  club_id                             uuid references clubs(id),
  created_at                          timestamptz not null default now()
);

alter table clubs
  add constraint clubs_owner_id_fkey
  foreign key (owner_id) references club_owners(id);

-- ------------------------------------------------------------------ --
-- PLAYERS
-- (profiles created and managed by the club owner)
-- ------------------------------------------------------------------ --

create table players (
  id                   uuid primary key default gen_random_uuid(),
  club_id              uuid not null references clubs(id) on delete cascade,
  gamer_tag            text not null,
  full_name            text,
  profile_picture_url  text,
  bio                  text,
  position             text,
  stats                jsonb not null default '{"matches_played":0,"wins":0,"losses":0}',
  created_at           timestamptz not null default now(),
  unique(club_id, gamer_tag)
);

-- ------------------------------------------------------------------ --
-- COMPETITIONS
-- ------------------------------------------------------------------ --

create table competitions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  type        competition_type not null,
  cycle       competition_cycle not null,
  format      competition_format not null,
  edition     text not null,
  entry_fee   numeric(10,2) not null default 0,
  status      competition_status not null default 'upcoming',
  description text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ --
-- COMPETITION ENTRIES
-- (which clubs are entered in which competitions)
-- ------------------------------------------------------------------ --

create table competition_entries (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  competition_id  uuid not null references competitions(id) on delete cascade,
  payment_status  payment_entry_status not null default 'unpaid',
  entered_at      timestamptz not null default now(),
  unique(club_id, competition_id)
);

-- ------------------------------------------------------------------ --
-- FIXTURES
-- ------------------------------------------------------------------ --

create table fixtures (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions(id) on delete cascade,
  stage           fixture_stage not null default 'N/A',
  group_name      text not null default 'Open',
  matchday        integer not null default 1,
  club_a_id       uuid not null references clubs(id),
  club_b_id       uuid not null references clubs(id),
  status          fixture_status not null default 'scheduled',
  reported_by_a   jsonb,  -- { score_a, score_b, proof_image_url, submitted_at }
  reported_by_b   jsonb,  -- { score_a, score_b, proof_image_url, submitted_at }
  confirmed_score jsonb,  -- { score_a, score_b }
  winner_club_id  uuid references clubs(id),
  scheduled_at    timestamptz,
  created_at      timestamptz not null default now(),
  check (club_a_id <> club_b_id)
);

-- ------------------------------------------------------------------ --
-- PAYMENTS
-- ------------------------------------------------------------------ --

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  type                payment_type not null,
  club_id             uuid not null references clubs(id),
  competition_id      uuid references competitions(id),
  amount              numeric(10,2) not null,
  paystack_reference  text not null unique,
  status              payment_status not null default 'pending',
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------------ --
-- ANNOUNCEMENTS
-- ------------------------------------------------------------------ --

create table announcements (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  body             text not null,
  image_url        text,
  published_at     timestamptz not null default now(),
  author_admin_id  uuid not null references auth.users(id)
);

-- ------------------------------------------------------------------ --
-- HIGHLIGHTS
-- ------------------------------------------------------------------ --

create table highlights (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  video_url       text not null,
  competition_id  uuid references competitions(id),
  thumbnail_url   text,
  published_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------ --
-- GLOBAL SPONSORS
-- ------------------------------------------------------------------ --

create table global_sponsors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  logo_url       text not null,
  tier           sponsor_tier not null,
  website_url    text,
  display_order  integer not null default 0
);

-- ------------------------------------------------------------------ --
-- FEE SETTINGS
-- (singleton row — one record that admin updates)
-- ------------------------------------------------------------------ --

create table fee_settings (
  id                        integer primary key default 1 check (id = 1),
  owner_registration_fee    numeric(10,2) not null default 0,
  updated_at                timestamptz not null default now(),
  updated_by                uuid not null references auth.users(id)
);

-- ------------------------------------------------------------------ --
-- ROW-LEVEL SECURITY
-- ------------------------------------------------------------------ --

alter table clubs enable row level security;
alter table club_owners enable row level security;
alter table players enable row level security;
alter table competitions enable row level security;
alter table competition_entries enable row level security;
alter table fixtures enable row level security;
alter table payments enable row level security;
alter table announcements enable row level security;
alter table highlights enable row level security;
alter table global_sponsors enable row level security;
alter table fee_settings enable row level security;

-- Public read: clubs (approved only), players, competitions, fixtures, announcements, highlights, global_sponsors
create policy "Public can read approved clubs"
  on clubs for select using (status = 'approved');

create policy "Public can read players"
  on players for select using (
    exists (select 1 from clubs where clubs.id = players.club_id and clubs.status = 'approved')
  );

create policy "Public can read competitions"
  on competitions for select using (true);

create policy "Public can read fixtures"
  on fixtures for select using (true);

create policy "Public can read announcements"
  on announcements for select using (true);

create policy "Public can read highlights"
  on highlights for select using (true);

create policy "Public can read global sponsors"
  on global_sponsors for select using (true);

-- Club owners can read/write their own club
create policy "Owner can read own club"
  on clubs for select using (
    owner_id = (select id from club_owners where user_id = auth.uid())
  );

create policy "Owner can update own club"
  on clubs for update using (
    owner_id = (select id from club_owners where user_id = auth.uid())
  );

-- Club owners can manage their own players
create policy "Owner can manage own players"
  on players for all using (
    club_id = (select club_id from club_owners where user_id = auth.uid())
  );

-- Club owners can read their own competition entries and payments
create policy "Owner can read own entries"
  on competition_entries for select using (
    club_id = (select club_id from club_owners where user_id = auth.uid())
  );

create policy "Owner can read own payments"
  on payments for select using (
    club_id = (select club_id from club_owners where user_id = auth.uid())
  );

-- Club owners can report results for their own fixtures
create policy "Owner can update own fixtures"
  on fixtures for update using (
    club_a_id = (select club_id from club_owners where user_id = auth.uid())
    or
    club_b_id = (select club_id from club_owners where user_id = auth.uid())
  );

-- ------------------------------------------------------------------ --
-- INDEXES
-- ------------------------------------------------------------------ --

create index on clubs(faculty);
create index on clubs(department);
create index on clubs(status);
create index on players(club_id);
create index on fixtures(competition_id);
create index on fixtures(status);
create index on competition_entries(club_id);
create index on competition_entries(competition_id);
create index on payments(club_id);
create index on announcements(published_at desc);
create index on highlights(published_at desc);
