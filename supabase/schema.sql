-- Sajda — schéma initial
-- À exécuter dans Supabase → SQL Editor → New query
-- Idempotent : peut être rejoué sans casser l'existant.

-- =====================================================================
-- 1. user_settings : un blob JSON par utilisateur (préférences app)
-- =====================================================================

create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  settings    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- 2. prayer_completions : prières marquées comme accomplies (par jour)
--    Une ligne = un (user, jour, prayer_id) avec son flag done.
-- =====================================================================

create table if not exists public.prayer_completions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  prayer_id   text not null,
  done        boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (user_id, date, prayer_id)
);

create index if not exists prayer_completions_user_date_idx
  on public.prayer_completions (user_id, date desc);

alter table public.prayer_completions enable row level security;

drop policy if exists "prayer_completions_select_own" on public.prayer_completions;
create policy "prayer_completions_select_own"
  on public.prayer_completions for select
  using (auth.uid() = user_id);

drop policy if exists "prayer_completions_insert_own" on public.prayer_completions;
create policy "prayer_completions_insert_own"
  on public.prayer_completions for insert
  with check (auth.uid() = user_id);

drop policy if exists "prayer_completions_update_own" on public.prayer_completions;
create policy "prayer_completions_update_own"
  on public.prayer_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prayer_completions_delete_own" on public.prayer_completions;
create policy "prayer_completions_delete_own"
  on public.prayer_completions for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- 3. updated_at trigger (utilisé sur les deux tables)
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at
  before update on public.user_settings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.prayer_completions;
create trigger set_updated_at
  before update on public.prayer_completions
  for each row execute procedure public.set_updated_at();
