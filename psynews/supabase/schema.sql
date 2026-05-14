-- ============================================================
-- PsyNews — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- or via: supabase db push (if using the Supabase CLI)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;   -- for full-text search on title/excerpt

-- ──────────────────────────────────────────────
-- 1. CATEGORIES
-- ──────────────────────────────────────────────
create table if not exists public.categories (
  id          text        primary key,                    -- e.g. 'research', 'policy'
  label       text        not null,
  color       text        not null default '#7C3AED',     -- hex accent color
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Public read-only
create policy "categories_select" on public.categories
  for select using (true);

-- ──────────────────────────────────────────────
-- 2. AUTHORS
-- ──────────────────────────────────────────────
create table if not exists public.authors (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  role        text        not null default 'Contributor',
  bio         text,
  avatar_url  text,
  twitter     text,
  created_at  timestamptz not null default now()
);

alter table public.authors enable row level security;

create policy "authors_select" on public.authors
  for select using (true);

-- ──────────────────────────────────────────────
-- 3. ARTICLES
-- ──────────────────────────────────────────────
create table if not exists public.articles (
  id            uuid        primary key default uuid_generate_v4(),
  title         text        not null,
  slug          text        not null unique,
  excerpt       text        not null,
  body          text,                                  -- full article markdown/HTML
  image_url     text,
  category_id   text        not null references public.categories(id) on delete restrict,
  author_id     uuid        not null references public.authors(id) on delete restrict,
  tags          text[]      not null default '{}',
  featured      boolean     not null default false,
  published     boolean     not null default true,
  read_time     text        not null default '5 min read',
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.articles enable row level security;

-- Public can read published articles
create policy "articles_select_published" on public.articles
  for select using (published = true);

-- Indexes
create index if not exists articles_category_idx  on public.articles (category_id);
create index if not exists articles_author_idx    on public.articles (author_id);
create index if not exists articles_featured_idx  on public.articles (featured) where featured = true;
create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_slug_idx      on public.articles (slug);
-- Full-text search index using pg_trgm
create index if not exists articles_title_trgm    on public.articles using gin (title gin_trgm_ops);
create index if not exists articles_excerpt_trgm  on public.articles using gin (excerpt gin_trgm_ops);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
  before update on public.articles
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────
-- 4. NEWSLETTER SUBSCRIBERS
-- ──────────────────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id          uuid        primary key default uuid_generate_v4(),
  email       text        not null unique,
  confirmed   boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Only allow insert from anon (no select — email addresses are private)
create policy "newsletter_insert" on public.newsletter_subscribers
  for insert with check (true);

-- ──────────────────────────────────────────────
-- 5. HELPER VIEW — articles with joined data
-- ──────────────────────────────────────────────
create or replace view public.articles_with_author as
  select
    a.*,
    au.name        as author_name,
    au.role        as author_role,
    au.avatar_url  as author_avatar_url,
    au.twitter     as author_twitter,
    c.label        as category_label,
    c.color        as category_color
  from public.articles a
  join public.authors    au on a.author_id   = au.id
  join public.categories c  on a.category_id = c.id
  where a.published = true;

-- ──────────────────────────────────────────────
-- 6. FULL-TEXT SEARCH FUNCTION
-- ──────────────────────────────────────────────
create or replace function public.search_articles(query text)
returns setof public.articles_with_author
language sql stable as $$
  select *
  from public.articles_with_author
  where
    title   ilike '%' || query || '%'
    or excerpt ilike '%' || query || '%'
    or author_name ilike '%' || query || '%'
    or category_label ilike '%' || query || '%'
    or query = any(tags)
  order by published_at desc;
$$;
