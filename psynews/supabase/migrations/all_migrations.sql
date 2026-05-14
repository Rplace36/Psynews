-- ================================================================
-- MIGRATION 01: Role-based access control
-- Run in Supabase SQL Editor
-- ================================================================

-- User roles enum
create type public.user_role as enum ('admin', 'editor', 'contributor');

-- User profiles table (extends Supabase auth.users)
create table if not exists public.user_profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'contributor',
  display_name text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users can read all profiles
create policy "profiles_select" on public.user_profiles
  for select using (true);

-- Users can update their own profile
create policy "profiles_update_own" on public.user_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Admins can update any profile
create policy "profiles_update_admin" on public.user_profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function: get current user's role
create or replace function public.current_user_role()
returns user_role language sql stable security definer as $$
  select role from public.user_profiles where id = auth.uid();
$$;

-- ── Update article RLS to use roles ──────────────────────────────

-- Drop old policies
drop policy if exists "articles_insert_auth"  on public.articles;
drop policy if exists "articles_update_auth"  on public.articles;
drop policy if exists "articles_delete_auth"  on public.articles;
drop policy if exists "articles_select_auth"  on public.articles;

-- Admins and editors can see all articles (incl. drafts)
create policy "articles_select_staff" on public.articles
  for select to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Contributors see only their own articles
create policy "articles_select_contributor" on public.articles
  for select to authenticated
  using (
    public.current_user_role() = 'contributor'
    and author_id = (
      select au.id from public.authors au where au.id = articles.author_id
    )
  );

-- All authenticated users can insert articles (status starts as draft)
create policy "articles_insert_auth" on public.articles
  for insert to authenticated with check (true);

-- Admins/editors can update any article; contributors only their own
create policy "articles_update_auth" on public.articles
  for update to authenticated
  using (
    public.current_user_role() in ('admin', 'editor')
    or (
      public.current_user_role() = 'contributor'
      and status = 'draft'
    )
  )
  with check (
    -- Contributors cannot set status beyond 'draft'
    public.current_user_role() in ('admin', 'editor')
    or (public.current_user_role() = 'contributor' and status = 'draft')
  );

-- Only admins can delete
create policy "articles_delete_admin" on public.articles
  for delete to authenticated
  using (public.current_user_role() = 'admin');
-- ================================================================
-- MIGRATION 02: Article status (draft / scheduled / published)
--               Replaces the boolean `published` column
-- ================================================================

-- Status enum
create type public.article_status as enum ('draft', 'scheduled', 'published');

-- Add status column (keep published for backward compat, sync via trigger)
alter table public.articles
  add column if not exists status article_status not null default 'draft';

-- Backfill: map existing published boolean → status
update public.articles
  set status = case when published then 'published' else 'draft' end;

-- Sync trigger: keep `published` boolean in sync with status
create or replace function public.sync_article_published()
returns trigger language plpgsql as $$
begin
  new.published := (new.status = 'published');
  -- Auto-publish scheduled articles whose time has passed
  if new.status = 'scheduled' and new.published_at <= now() then
    new.status   := 'published';
    new.published := true;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_sync_published on public.articles;
create trigger articles_sync_published
  before insert or update on public.articles
  for each row execute procedure public.sync_article_published();

-- Function to publish all due scheduled articles (call from a cron job or edge function)
create or replace function public.publish_scheduled_articles()
returns integer language plpgsql security definer as $$
declare
  cnt integer;
begin
  update public.articles
  set status = 'published', published = true, updated_at = now()
  where status = 'scheduled'
    and published_at <= now();
  get diagnostics cnt = row_count;
  return cnt;
end;
$$;

-- Update the view to expose status
create or replace view public.articles_with_author as
  select
    a.id, a.title, a.slug, a.excerpt, a.body, a.image_url,
    a.category_id, a.author_id, a.tags, a.featured,
    a.published, a.status,
    a.read_time, a.published_at, a.created_at, a.updated_at,
    a.view_count,
    au.name       as author_name,
    au.role       as author_role,
    au.avatar_url as author_avatar_url,
    au.twitter    as author_twitter,
    c.label       as category_label,
    c.color       as category_color
  from public.articles a
  join public.authors    au on a.author_id   = au.id
  join public.categories c  on a.category_id = c.id
  where a.status = 'published';
-- ================================================================
-- MIGRATION 03: Article view counts + trending system
-- ================================================================

-- Add view_count to articles
alter table public.articles
  add column if not exists view_count integer not null default 0;

-- Article views log (for analytics / deduplication)
create table if not exists public.article_views (
  id          bigserial   primary key,
  article_id  uuid        not null references public.articles(id) on delete cascade,
  -- fingerprint: hashed IP + user-agent (never store raw PII)
  fingerprint text,
  referrer    text,
  viewed_at   timestamptz not null default now()
);

alter table public.article_views enable row level security;

-- Anyone can insert a view (anon included)
create policy "views_insert" on public.article_views
  for insert with check (true);

-- Only authenticated staff can read view logs
create policy "views_select_staff" on public.article_views
  for select to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Index for fast aggregation
create index if not exists views_article_idx  on public.article_views (article_id);
create index if not exists views_time_idx     on public.article_views (viewed_at desc);

-- Function: record a view + increment counter (idempotent per fingerprint/hour)
create or replace function public.record_article_view(
  p_article_id  uuid,
  p_fingerprint text default null,
  p_referrer    text default null
)
returns void language plpgsql security definer as $$
begin
  -- Skip if same fingerprint viewed in the last hour
  if p_fingerprint is not null then
    if exists (
      select 1 from public.article_views
      where article_id  = p_article_id
        and fingerprint = p_fingerprint
        and viewed_at   > now() - interval '1 hour'
    ) then
      return;
    end if;
  end if;

  insert into public.article_views (article_id, fingerprint, referrer)
  values (p_article_id, p_fingerprint, p_referrer);

  update public.articles
    set view_count = view_count + 1, updated_at = now()
    where id = p_article_id;
end;
$$;

-- Trending score: views in last 7 days + recency boost
create or replace function public.get_trending_articles(p_limit integer default 10)
returns table (
  article_id  uuid,
  trend_score numeric
) language sql stable security definer as $$
  select
    av.article_id,
    sum(
      case
        when av.viewed_at > now() - interval '1 day'  then 3.0
        when av.viewed_at > now() - interval '3 days' then 2.0
        when av.viewed_at > now() - interval '7 days' then 1.0
        else 0.0
      end
    ) as trend_score
  from public.article_views av
  join public.articles a on a.id = av.article_id and a.status = 'published'
  where av.viewed_at > now() - interval '7 days'
  group by av.article_id
  order by trend_score desc
  limit p_limit;
$$;

-- "Most read this week" view
create or replace view public.most_read_this_week as
  select
    aw.*,
    t.trend_score
  from public.get_trending_articles(20) t
  join public.articles_with_author aw on aw.id = t.article_id
  order by t.trend_score desc;
-- ================================================================
-- MIGRATION 04: Comments with moderation
-- ================================================================

create type public.comment_status as enum ('pending', 'approved', 'rejected', 'spam');

create table if not exists public.comments (
  id          uuid          primary key default uuid_generate_v4(),
  article_id  uuid          not null references public.articles(id) on delete cascade,
  parent_id   uuid          references public.comments(id) on delete cascade,
  -- Authenticated or guest
  author_id   uuid          references auth.users(id) on delete set null,
  author_name text          not null,
  author_email text,   -- hashed before storage in application layer
  body        text          not null check (char_length(body) between 1 and 2000),
  status      comment_status not null default 'pending',
  spam_score  numeric       default 0,
  ip_hash     text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

alter table public.comments enable row level security;

-- Public can see approved comments
create policy "comments_select_approved" on public.comments
  for select using (status = 'approved');

-- Authenticated staff see all comments
create policy "comments_select_staff" on public.comments
  for select to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Anyone can insert (starts as pending)
create policy "comments_insert" on public.comments
  for insert with check (status = 'pending');

-- Staff can update (approve/reject/mark spam)
create policy "comments_update_staff" on public.comments
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Admins can delete
create policy "comments_delete_admin" on public.comments
  for delete to authenticated
  using (public.current_user_role() = 'admin');

-- Indexes
create index if not exists comments_article_idx on public.comments (article_id);
create index if not exists comments_status_idx  on public.comments (status);
create index if not exists comments_parent_idx  on public.comments (parent_id) where parent_id is not null;

-- Comment count on articles (denormalized for performance)
alter table public.articles
  add column if not exists comment_count integer not null default 0;

create or replace function public.update_comment_count()
returns trigger language plpgsql as $$
begin
  update public.articles
  set comment_count = (
    select count(*) from public.comments
    where article_id = coalesce(new.article_id, old.article_id)
      and status = 'approved'
  )
  where id = coalesce(new.article_id, old.article_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists comments_count_trigger on public.comments;
create trigger comments_count_trigger
  after insert or update or delete on public.comments
  for each row execute procedure public.update_comment_count();
-- ================================================================
-- MIGRATION 05: Supabase Storage buckets
-- ================================================================

-- Create article-images bucket (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read public images
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'article-images');

-- Authenticated users can upload
create policy "images_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'article-images');

-- Authenticated users can update/replace their uploads
create policy "images_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'article-images');

-- Only admins can delete storage objects
create policy "images_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'article-images'
    and public.current_user_role() = 'admin'
  );
-- ================================================================
-- MIGRATION 06: Newsletter enhancements
-- ================================================================

-- Add more fields to newsletter_subscribers
alter table public.newsletter_subscribers
  add column if not exists name           text,
  add column if not exists source         text,      -- 'homepage', 'article', 'admin'
  add column if not exists welcome_sent   boolean not null default false,
  add column if not exists unsubscribed   boolean not null default false,
  add column if not exists unsubscribed_at timestamptz;

-- Newsletter campaigns (for tracking sends)
create table if not exists public.newsletter_campaigns (
  id            uuid        primary key default uuid_generate_v4(),
  subject       text        not null,
  preview_text  text,
  body_html     text        not null,
  body_text     text,
  status        text        not null default 'draft', -- draft | sent
  sent_at       timestamptz,
  recipient_count integer   default 0,
  created_by    uuid        references auth.users(id),
  created_at    timestamptz not null default now()
);

alter table public.newsletter_campaigns enable row level security;

create policy "campaigns_staff" on public.newsletter_campaigns
  for all to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Authenticated staff can read subscriber list
drop policy if exists "newsletter_select_auth" on public.newsletter_subscribers;
create policy "newsletter_select_staff" on public.newsletter_subscribers
  for select to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- Allow authenticated users to update (for unsubscribe flows)
create policy "newsletter_update_auth" on public.newsletter_subscribers
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'));
