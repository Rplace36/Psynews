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
