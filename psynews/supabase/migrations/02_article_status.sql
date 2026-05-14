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
