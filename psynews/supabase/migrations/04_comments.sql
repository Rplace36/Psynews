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
