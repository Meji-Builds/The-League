-- Club owner posts: news/updates submitted by club owners, approved by admin before going public

create table if not exists club_posts (
  id           uuid        primary key default gen_random_uuid(),
  club_id      uuid        not null references clubs(id) on delete cascade,
  title        text        not null,
  body         text,
  image_url    text,
  status       text        not null default 'pending', -- pending | approved | rejected
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

alter table club_posts enable row level security;

-- Anyone can read approved posts
create policy "Public read approved club posts"
  on club_posts for select
  using (status = 'approved');

-- Club owners can insert posts for their own club and read all their own posts
create policy "Club owners insert their posts"
  on club_posts for insert
  with check (
    exists (
      select 1 from club_owners
      where club_owners.club_id = club_posts.club_id
        and club_owners.user_id = auth.uid()
    )
  );

create policy "Club owners read their posts"
  on club_posts for select
  using (
    exists (
      select 1 from club_owners
      where club_owners.club_id = club_posts.club_id
        and club_owners.user_id = auth.uid()
    )
  );

-- Admins can do everything
create policy "Admins full access to club posts"
  on club_posts for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
