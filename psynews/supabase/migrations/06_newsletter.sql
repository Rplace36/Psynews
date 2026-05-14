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
