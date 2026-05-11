-- Fix : récursion infinie dans les policies RLS de room_members.
-- Une policy qui SELECT depuis sa propre table déclenche elle-même.
-- Solution : fonction SECURITY DEFINER qui contourne RLS pour la vérification d'appartenance.
-- Idempotent : peut être rejoué.

-- =====================================================================
-- 1. Fonctions helper SECURITY DEFINER (bypass RLS interne)
-- =====================================================================

create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_user_id
  )
$$;

create or replace function public.is_room_owner(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where id = p_room_id and owner_id = p_user_id
  )
$$;

-- Permet à l'utilisateur authentifié d'appeler ces helpers
grant execute on function public.is_room_member(uuid, uuid) to authenticated;
grant execute on function public.is_room_owner(uuid, uuid)  to authenticated;

-- =====================================================================
-- 2. Policies rooms : utiliser les helpers
-- =====================================================================

drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
  on public.rooms for select
  using (
    auth.uid() = owner_id
    or public.is_room_member(rooms.id, auth.uid())
  );

-- =====================================================================
-- 3. Policies room_members : utiliser les helpers (résout la récursion)
-- =====================================================================

drop policy if exists "room_members_select_same_room" on public.room_members;
create policy "room_members_select_same_room"
  on public.room_members for select
  using (
    user_id = auth.uid()
    or public.is_room_owner(room_members.room_id, auth.uid())
    or public.is_room_member(room_members.room_id, auth.uid())
  );

drop policy if exists "room_members_insert_owner" on public.room_members;
create policy "room_members_insert_owner"
  on public.room_members for insert
  with check (
    public.is_room_owner(room_members.room_id, auth.uid())
    or auth.uid() = user_id
  );

drop policy if exists "room_members_delete_self_or_owner" on public.room_members;
create policy "room_members_delete_self_or_owner"
  on public.room_members for delete
  using (
    auth.uid() = user_id
    or public.is_room_owner(room_members.room_id, auth.uid())
  );

-- =====================================================================
-- 4. Policies room_messages : utiliser les helpers
-- =====================================================================

drop policy if exists "room_messages_select_members" on public.room_messages;
create policy "room_messages_select_members"
  on public.room_messages for select
  using (
    public.is_room_member(room_messages.room_id, auth.uid())
    or public.is_room_owner(room_messages.room_id, auth.uid())
  );

drop policy if exists "room_messages_insert_members" on public.room_messages;
create policy "room_messages_insert_members"
  on public.room_messages for insert
  with check (
    auth.uid() = user_id
    and (
      public.is_room_member(room_messages.room_id, auth.uid())
      or public.is_room_owner(room_messages.room_id, auth.uid())
    )
  );

-- =====================================================================
-- 5. Policies room_sessions : utiliser les helpers
-- =====================================================================

drop policy if exists "room_sessions_select_members" on public.room_sessions;
create policy "room_sessions_select_members"
  on public.room_sessions for select
  using (
    public.is_room_member(room_sessions.room_id, auth.uid())
    or public.is_room_owner(room_sessions.room_id, auth.uid())
  );

drop policy if exists "room_sessions_insert_members" on public.room_sessions;
create policy "room_sessions_insert_members"
  on public.room_sessions for insert
  with check (
    auth.uid() = started_by
    and (
      public.is_room_member(room_sessions.room_id, auth.uid())
      or public.is_room_owner(room_sessions.room_id, auth.uid())
    )
  );

-- =====================================================================
-- 6. Policies storage (audio bucket) : utiliser le helper
-- =====================================================================

drop policy if exists "room_audio_read_members" on storage.objects;
create policy "room_audio_read_members"
  on storage.objects for select
  using (
    bucket_id = 'room-audio'
    and public.is_room_member(split_part(name, '/', 1)::uuid, auth.uid())
  );

drop policy if exists "room_audio_upload_members" on storage.objects;
create policy "room_audio_upload_members"
  on storage.objects for insert
  with check (
    bucket_id = 'room-audio'
    and public.is_room_member(split_part(name, '/', 1)::uuid, auth.uid())
  );

drop policy if exists "room_audio_delete_owner" on storage.objects;
create policy "room_audio_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'room-audio'
    and (
      owner = auth.uid()
      or public.is_room_owner(split_part(name, '/', 1)::uuid, auth.uid())
    )
  );
