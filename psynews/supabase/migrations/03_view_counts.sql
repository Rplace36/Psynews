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
