-- ============================================================
-- PsyNews — Admin RLS Policies
-- Run this ONCE in Supabase SQL Editor to enable the admin
-- dashboard to create, edit, and delete articles/authors.
--
-- This allows authenticated users (Supabase Auth) to perform
-- full CRUD on the articles and authors tables.
-- ============================================================

-- Articles: authenticated users can insert/update/delete
create policy "articles_insert_auth" on public.articles
  for insert to authenticated with check (true);

create policy "articles_update_auth" on public.articles
  for update to authenticated using (true) with check (true);

create policy "articles_delete_auth" on public.articles
  for delete to authenticated using (true);

-- Allow authenticated users to read all articles (incl. drafts)
create policy "articles_select_auth" on public.articles
  for select to authenticated using (true);

-- Authors: authenticated users can insert/update
create policy "authors_insert_auth" on public.authors
  for insert to authenticated with check (true);

create policy "authors_update_auth" on public.authors
  for update to authenticated using (true) with check (true);

-- Newsletter: authenticated users can read subscribers
create policy "newsletter_select_auth" on public.newsletter_subscribers
  for select to authenticated using (true);
