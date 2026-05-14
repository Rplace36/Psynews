-- ============================================================
-- PsyNews — Supabase Schema  (Supabase-hosted safe version)
-- Run in: Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- uuid-ossp is pre-enabled on all Supabase projects
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. CATEGORIES
-- ──────────────────────────────────────────────
create table if not exists public.categories (
  id          text        primary key,
  label       text        not null,
  color       text        not null default '#7C3AED',
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

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
  body          text,
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

create policy "articles_select_published" on public.articles
  for select using (published = true);

-- Indexes (no pg_trgm needed)
create index if not exists articles_category_idx  on public.articles (category_id);
create index if not exists articles_author_idx    on public.articles (author_id);
create index if not exists articles_featured_idx  on public.articles (featured) where featured = true;
create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_slug_idx      on public.articles (slug);

-- Auto-update updated_at trigger
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

create policy "newsletter_insert" on public.newsletter_subscribers
  for insert with check (true);

-- ──────────────────────────────────────────────
-- 5. ARTICLES + AUTHOR + CATEGORY VIEW
-- ──────────────────────────────────────────────
create or replace view public.articles_with_author as
  select
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.body,
    a.image_url,
    a.category_id,
    a.author_id,
    a.tags,
    a.featured,
    a.published,
    a.read_time,
    a.published_at,
    a.created_at,
    a.updated_at,
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
-- 6. SEARCH FUNCTION (ilike, no pg_trgm)
-- ──────────────────────────────────────────────
create or replace function public.search_articles(query text)
returns setof public.articles_with_author
language sql stable security definer as $$
  select *
  from public.articles_with_author
  where
    title          ilike '%' || query || '%'
    or excerpt     ilike '%' || query || '%'
    or author_name ilike '%' || query || '%'
    or category_label ilike '%' || query || '%'
    or query = any(tags)
  order by published_at desc;
$$;
-- ============================================================
-- PsyNews — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ──────────────────────────────────────────────
-- CATEGORIES
-- ──────────────────────────────────────────────
insert into public.categories (id, label, color, sort_order) values
  ('research', 'Psychedelic Research', '#7C3AED', 1),
  ('policy',   'Policy',               '#0EA5E9', 2),
  ('culture',  'Culture',              '#F59E0B', 3),
  ('events',   'Events',               '#10B981', 4),
  ('books',    'Books',                '#EC4899', 5),
  ('opinion',  'Opinion',              '#EF4444', 6)
on conflict (id) do update set
  label      = excluded.label,
  color      = excluded.color,
  sort_order = excluded.sort_order;

-- ──────────────────────────────────────────────
-- AUTHORS
-- ──────────────────────────────────────────────
insert into public.authors (id, name, role, bio, avatar_url) values
  (
    '11111111-0000-0000-0000-000000000001',
    'Dr. Sarah Chen',
    'Science Editor',
    'Dr. Sarah Chen covers psychedelic neuroscience and clinical research. She holds a PhD in pharmacology from UCSF and has reported on psychedelic research for over a decade.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'James Okafor',
    'Policy Correspondent',
    'James covers drug policy, regulation, and legal developments across the US and globally. Based in Washington D.C.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Dr. Elena Vasquez',
    'Neuroscience Reporter',
    'Elena is a neuroscientist turned journalist who translates cutting-edge brain research for a general audience.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000004',
    'Mara Lindqvist',
    'Policy Editor',
    'Mara has spent years tracking state-level psychedelic reform from Colorado to Oregon and beyond.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000005',
    'Clara Bennett',
    'Books Editor',
    'Clara reviews books at the intersection of consciousness, medicine, and culture.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000006',
    'Tomás Rivera',
    'Culture Correspondent',
    'Tomás reports on psychedelic culture, festivals, art, and the communities forming around the renaissance.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000007',
    'Dr. Rachel Kim',
    'Contributing Editor',
    'Dr. Kim is a psychiatrist and contributing editor who writes critical opinion pieces on the clinical psychedelic space.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000008',
    'Ana Ferreira',
    'Cultural Reporter',
    'Ana specialises in indigenous medicine traditions, ethics, and the globalisation of plant medicine.',
    null
  ),
  (
    '11111111-0000-0000-0000-000000000009',
    'Yuki Tanaka',
    'Features Writer',
    'Yuki writes long-form features on the human side of the psychedelic renaissance — therapists, patients, communities.',
    null
  )
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  bio  = excluded.bio;

-- ──────────────────────────────────────────────
-- ARTICLES
-- ──────────────────────────────────────────────
insert into public.articles
  (id, title, slug, excerpt, image_url, category_id, author_id, tags, featured, read_time, published_at)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'MAPS Phase 3 Trial: MDMA-Assisted Therapy Shows 71% Remission Rate in PTSD Patients',
    'maps-phase-3-mdma-ptsd-71-percent',
    'A landmark multi-site Phase 3 clinical trial published in Nature Medicine reveals unprecedented success rates, potentially reshaping psychiatric treatment protocols worldwide.',
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80',
    'research',
    '11111111-0000-0000-0000-000000000001',
    array['MDMA','PTSD','Clinical Trials','FDA'],
    true,
    '8 min read',
    '2026-05-12 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Australia Becomes First Nation to Legalize Psilocybin for Treatment-Resistant Depression',
    'australia-legalizes-psilocybin-depression',
    'Authorized prescribers can now legally administer psilocybin and MDMA for therapeutic purposes, marking a seismic shift in global drug policy.',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'policy',
    '11111111-0000-0000-0000-000000000002',
    array['Psilocybin','Australia','Policy','Depression'],
    true,
    '6 min read',
    '2026-05-10 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'The Neuroplasticity Window: How Psychedelics Rewire the Brain After a Single Dose',
    'neuroplasticity-window-psychedelics-brain',
    'New imaging studies from Johns Hopkins reveal structural changes in the default mode network persisting up to six months after a single guided psilocybin session.',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80',
    'research',
    '11111111-0000-0000-0000-000000000003',
    array['Neuroplasticity','Psilocybin','Brain','Johns Hopkins'],
    true,
    '10 min read',
    '2026-05-09 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Oregon''s Psilocybin Service Centers: One Year In — What We''ve Learned',
    'oregon-psilocybin-service-centers-one-year',
    'A deep dive into the first 12 months of Oregon''s state-regulated psilocybin program, including outcomes, challenges, and what other states are watching closely.',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'policy',
    '11111111-0000-0000-0000-000000000004',
    array['Oregon','Regulation','Psilocybin Services','Legalization'],
    false,
    '12 min read',
    '2026-05-08 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Michael Pollan on ''The Doors of Perception'' 70 Years Later: A Modern Rereading',
    'doors-of-perception-70-years-modern-rereading',
    'The best-selling author revisits Aldous Huxley''s foundational text and examines what the mescaline-fueled vision has — and hasn''t — predicted about today''s psychedelic renaissance.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
    'books',
    '11111111-0000-0000-0000-000000000005',
    array['Huxley','Books','Mescaline','History'],
    false,
    '7 min read',
    '2026-05-07 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000006',
    'Sacred Geometry Festival Returns to Ojai Valley with Expanded Wellness Programming',
    'sacred-geometry-festival-ojai-2026',
    'The annual gathering of psychedelic culture, art, and science adds a dedicated symposium track featuring researchers, therapists, and integration coaches.',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    'events',
    '11111111-0000-0000-0000-000000000006',
    array['Festival','Events','Integration','Community'],
    false,
    '4 min read',
    '2026-05-06 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000007',
    'Ketamine Clinics Are Booming — But Are They Delivering on Their Promise?',
    'ketamine-clinics-booming-delivering-promise',
    'With hundreds of clinics opening annually, questions mount about standardization, pricing, and whether the rapid expansion is outpacing the evidence base.',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    'opinion',
    '11111111-0000-0000-0000-000000000007',
    array['Ketamine','Clinics','Opinion','Mental Health'],
    false,
    '9 min read',
    '2026-05-05 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000008',
    'Ayahuasca Tourism in the Amazon: The Ethics of Commercializing Sacred Medicine',
    'ayahuasca-tourism-amazon-ethics',
    'As Western interest in ayahuasca ceremonies surges, indigenous communities grapple with economic opportunity, cultural appropriation, and ecological impact.',
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80',
    'culture',
    '11111111-0000-0000-0000-000000000008',
    array['Ayahuasca','Indigenous','Ethics','Amazon'],
    false,
    '11 min read',
    '2026-05-04 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000009',
    'New Study Links Microdosing Psilocybin to Reduced Anxiety in Cancer Patients',
    'microdosing-psilocybin-anxiety-cancer-patients',
    'Researchers at UCSF report that sub-perceptual psilocybin doses significantly reduced existential distress in late-stage cancer patients over a 12-week protocol.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
    'research',
    '11111111-0000-0000-0000-000000000001',
    array['Microdosing','Cancer','Anxiety','UCSF'],
    false,
    '6 min read',
    '2026-05-03 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000010',
    'The Psychedelic Therapist Shortage: Training a New Generation of Guides',
    'psychedelic-therapist-shortage-training',
    'As demand for psychedelic-assisted therapy outpaces supply, universities, institutes, and private programs race to credential the next wave of practitioners.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    'culture',
    '11111111-0000-0000-0000-000000000009',
    array['Therapists','Training','Education','Workforce'],
    false,
    '8 min read',
    '2026-05-02 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000011',
    'Review: ''Changing Our Minds'' by Don Lattin — The Definitive History of Psychedelic Research',
    'changing-our-minds-don-lattin-review',
    'This exhaustive new volume traces psychedelic research from its 1950s origins through the War on Drugs and into the modern renaissance with rare archival detail.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
    'books',
    '11111111-0000-0000-0000-000000000005',
    array['Book Review','History','Research','Literature'],
    false,
    '5 min read',
    '2026-05-01 09:00:00+00'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000012',
    'International Psychedelic Science Conference 2026: Key Takeaways',
    'psychedelic-science-conference-2026-takeaways',
    'More than 3,000 researchers, clinicians, and advocates gathered in Denver for the largest psychedelic science event in history. Here''s what mattered.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    'events',
    '11111111-0000-0000-0000-000000000002',
    array['Conference','Science','Denver','2026'],
    false,
    '14 min read',
    '2026-04-30 09:00:00+00'
  )
on conflict (id) do update set
  title        = excluded.title,
  slug         = excluded.slug,
  excerpt      = excluded.excerpt,
  image_url    = excluded.image_url,
  category_id  = excluded.category_id,
  author_id    = excluded.author_id,
  tags         = excluded.tags,
  featured     = excluded.featured,
  read_time    = excluded.read_time,
  published_at = excluded.published_at;
