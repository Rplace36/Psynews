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
