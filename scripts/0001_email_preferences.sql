-- Email preferences — controls transactional and marketing email delivery.
-- Unsubscribe links write to this table. If a row does not exist for a user,
-- the system treats both categories as "enabled" (default true below).

create table if not exists public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  transactional_enabled boolean not null default true,
  marketing_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;

drop policy if exists "email_prefs_select_own" on public.email_preferences;
create policy "email_prefs_select_own"
  on public.email_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "email_prefs_upsert_own" on public.email_preferences;
create policy "email_prefs_upsert_own"
  on public.email_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Server-side code uses the service role key to bypass RLS for unsubscribe
-- links (because the user is not authenticated when clicking an email link).
