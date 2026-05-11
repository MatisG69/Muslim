-- Sajda — module Halaqa (social récitation + amis + rooms temps réel)
-- À exécuter dans Supabase → SQL Editor → New query (après schema.sql)
-- Idempotent : peut être rejoué sans casser l'existant.
--
-- Ordre d'exécution :
--   1) Création de toutes les tables (sans policies)
--   2) Triggers
--   3) Création de toutes les policies (résout les forward references)
--   4) Storage + Realtime

-- =====================================================================
-- 1. TABLES
-- =====================================================================

-- 1.1 profiles : profil public lié à auth.users (lookup par username)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

create index if not exists profiles_username_idx on public.profiles (username);
alter table public.profiles enable row level security;

-- 1.2 friendships : relation d'amitié (paire ordonnée canonique)
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_a       uuid not null references auth.users(id) on delete cascade,
  user_b       uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'blocked')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (user_a, user_b),
  check (user_a < user_b),
  check (requested_by in (user_a, user_b))
);

create index if not exists friendships_user_a_idx on public.friendships (user_a);
create index if not exists friendships_user_b_idx on public.friendships (user_b);
alter table public.friendships enable row level security;

-- 1.3 rooms : salle de récitation / rappel / histoire
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text,
  kind          text not null default 'recitation'
                check (kind in ('recitation', 'reminder', 'story', 'mixed')),
  is_group      boolean not null default false,
  scheduled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists rooms_owner_idx on public.rooms (owner_id);
alter table public.rooms enable row level security;

-- 1.4 room_members : appartenance à une room
create table if not exists public.room_members (
  room_id    uuid not null references public.rooms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member'
             check (role in ('host', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_members_user_idx on public.room_members (user_id);
alter table public.room_members enable row level security;

-- 1.5 room_messages : messages texte ou audio
create table if not exists public.room_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'text'
              check (kind in ('text', 'audio', 'system')),
  content     text,
  audio_path  text,
  duration_ms int,
  created_at  timestamptz not null default now()
);

create index if not exists room_messages_room_idx
  on public.room_messages (room_id, created_at desc);
alter table public.room_messages enable row level security;

-- 1.6 room_sessions : sessions live (audit / historique)
create table if not exists public.room_sessions (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  started_by  uuid not null references auth.users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create index if not exists room_sessions_room_idx
  on public.room_sessions (room_id, started_at desc);
alter table public.room_sessions enable row level security;

-- =====================================================================
-- 2. FONCTIONS + TRIGGERS
-- =====================================================================

-- 2.1 set_updated_at générique (peut déjà exister depuis schema.sql)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.rooms;
create trigger set_updated_at
  before update on public.rooms
  for each row execute procedure public.set_updated_at();

-- 2.2 handle_new_user : crée un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate     text;
  suffix        int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if length(base_username) < 3 then
    base_username := 'mu_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  base_username := substr(base_username, 1, 20);
  candidate := base_username;

  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := substr(base_username, 1, 20) || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- 3. POLICIES (toutes les tables existent à ce stade)
-- =====================================================================

-- 3.1 profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3.2 friendships
drop policy if exists "friendships_select_members" on public.friendships;
create policy "friendships_select_members"
  on public.friendships for select
  using (auth.uid() in (user_a, user_b));

drop policy if exists "friendships_insert_initiator" on public.friendships;
create policy "friendships_insert_initiator"
  on public.friendships for insert
  with check (auth.uid() = requested_by and auth.uid() in (user_a, user_b));

drop policy if exists "friendships_update_recipient" on public.friendships;
create policy "friendships_update_recipient"
  on public.friendships for update
  using (auth.uid() in (user_a, user_b))
  with check (auth.uid() in (user_a, user_b));

drop policy if exists "friendships_delete_members" on public.friendships;
create policy "friendships_delete_members"
  on public.friendships for delete
  using (auth.uid() in (user_a, user_b));

-- 3.3 rooms
drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
  on public.rooms for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = rooms.id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "rooms_insert_owner" on public.rooms;
create policy "rooms_insert_owner"
  on public.rooms for insert
  with check (auth.uid() = owner_id);

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner"
  on public.rooms for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
  on public.rooms for delete
  using (auth.uid() = owner_id);

-- 3.4 room_members
drop policy if exists "room_members_select_same_room" on public.room_members;
create policy "room_members_select_same_room"
  on public.room_members for select
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_members.room_id and rm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "room_members_insert_owner" on public.room_members;
create policy "room_members_insert_owner"
  on public.room_members for insert
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.owner_id = auth.uid()
    )
    or auth.uid() = user_id
  );

drop policy if exists "room_members_delete_self_or_owner" on public.room_members;
create policy "room_members_delete_self_or_owner"
  on public.room_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_members.room_id and r.owner_id = auth.uid()
    )
  );

-- 3.5 room_messages
drop policy if exists "room_messages_select_members" on public.room_messages;
create policy "room_messages_select_members"
  on public.room_messages for select
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_messages.room_id and rm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rooms r
      where r.id = room_messages.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "room_messages_insert_members" on public.room_messages;
create policy "room_messages_insert_members"
  on public.room_messages for insert
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.room_members rm
        where rm.room_id = room_messages.room_id and rm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.rooms r
        where r.id = room_messages.room_id and r.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "room_messages_delete_own" on public.room_messages;
create policy "room_messages_delete_own"
  on public.room_messages for delete
  using (auth.uid() = user_id);

-- 3.6 room_sessions
drop policy if exists "room_sessions_select_members" on public.room_sessions;
create policy "room_sessions_select_members"
  on public.room_sessions for select
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_sessions.room_id and rm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rooms r
      where r.id = room_sessions.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "room_sessions_insert_members" on public.room_sessions;
create policy "room_sessions_insert_members"
  on public.room_sessions for insert
  with check (
    auth.uid() = started_by
    and (
      exists (
        select 1 from public.room_members rm
        where rm.room_id = room_sessions.room_id and rm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.rooms r
        where r.id = room_sessions.room_id and r.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "room_sessions_update_starter" on public.room_sessions;
create policy "room_sessions_update_starter"
  on public.room_sessions for update
  using (auth.uid() = started_by)
  with check (auth.uid() = started_by);

-- =====================================================================
-- 4. Storage bucket pour les audios de room_messages
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('room-audio', 'room-audio', false)
on conflict (id) do nothing;

-- Lecture : membres de la room (path : {room_id}/{file})
drop policy if exists "room_audio_read_members" on storage.objects;
create policy "room_audio_read_members"
  on storage.objects for select
  using (
    bucket_id = 'room-audio'
    and exists (
      select 1 from public.room_members rm
      where rm.room_id::text = split_part(name, '/', 1)
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room_audio_upload_members" on storage.objects;
create policy "room_audio_upload_members"
  on storage.objects for insert
  with check (
    bucket_id = 'room-audio'
    and exists (
      select 1 from public.room_members rm
      where rm.room_id::text = split_part(name, '/', 1)
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists "room_audio_delete_owner" on storage.objects;
create policy "room_audio_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'room-audio'
    and (
      owner = auth.uid()
      or exists (
        select 1 from public.rooms r
        where r.id::text = split_part(name, '/', 1)
          and r.owner_id = auth.uid()
      )
    )
  );

-- =====================================================================
-- 5. Realtime publication (pour les souscriptions live)
-- =====================================================================

alter table public.friendships    replica identity full;
alter table public.room_members   replica identity full;
alter table public.room_messages  replica identity full;
alter table public.room_sessions  replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.friendships;   exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.room_members;  exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.room_messages; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.room_sessions; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.rooms;         exception when duplicate_object then null; end;
  end if;
end $$;
