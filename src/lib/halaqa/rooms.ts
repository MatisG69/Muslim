'use client'

import { supabase } from '@/lib/supabase/client'
import { getProfilesByIds } from './profiles'
import type { Room, RoomKind, RoomMember, RoomSession, RoomWithMembers } from './types'

export const listMyRooms = async (currentUserId: string): Promise<Room[]> => {
  // Rooms dont je suis owner ou membre
  const [ownedRes, memberRes] = await Promise.all([
    supabase().from('rooms').select('*').eq('owner_id', currentUserId),
    supabase()
      .from('room_members')
      .select('room_id, rooms(*)')
      .eq('user_id', currentUserId),
  ])
  if (ownedRes.error) throw ownedRes.error
  if (memberRes.error) throw memberRes.error

  const owned: Room[] = ownedRes.data ?? []
  const joined: Room[] = (memberRes.data ?? [])
    .map((row: any) => row.rooms)
    .filter(Boolean)

  const byId = new Map<string, Room>()
  for (const r of [...owned, ...joined]) byId.set(r.id, r)
  return Array.from(byId.values()).sort((a, b) =>
    (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
  )
}

export const getRoom = async (roomId: string): Promise<RoomWithMembers | null> => {
  const { data: room, error } = await supabase()
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle()
  if (error) throw error
  if (!room) return null

  const { data: members, error: memErr } = await supabase()
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
  if (memErr) throw memErr

  const userIds = Array.from(
    new Set([room.owner_id, ...(members ?? []).map(m => m.user_id)]),
  )
  const profiles = await getProfilesByIds(userIds)

  const hydratedMembers: RoomMember[] = (members ?? []).map(m => ({
    ...m,
    profile: profiles.get(m.user_id) ?? null,
  }))

  return {
    ...room,
    owner: profiles.get(room.owner_id) ?? null,
    members: hydratedMembers,
  }
}

export type CreateRoomInput = {
  title: string
  description?: string
  kind: RoomKind
  is_group: boolean
  scheduled_at?: string | null
  invite_user_ids?: string[]
}

export const createRoom = async (
  currentUserId: string,
  input: CreateRoomInput,
): Promise<Room> => {
  const { data: room, error } = await supabase()
    .from('rooms')
    .insert({
      owner_id: currentUserId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      kind: input.kind,
      is_group: input.is_group,
      scheduled_at: input.scheduled_at ?? null,
    })
    .select('*')
    .single()
  if (error) throw error

  const memberRows = [
    { room_id: room.id, user_id: currentUserId, role: 'host' as const },
    ...(input.invite_user_ids ?? []).map(uid => ({
      room_id: room.id,
      user_id: uid,
      role: 'member' as const,
    })),
  ]

  const { error: memErr } = await supabase().from('room_members').insert(memberRows)
  if (memErr) throw memErr

  return room
}

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  const { error } = await supabase()
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)
  if (error) throw error
}

export const deleteRoom = async (roomId: string): Promise<void> => {
  const { error } = await supabase().from('rooms').delete().eq('id', roomId)
  if (error) throw error
}

export const inviteToRoom = async (
  roomId: string,
  userIds: string[],
): Promise<void> => {
  if (userIds.length === 0) return
  const rows = userIds.map(uid => ({
    room_id: roomId,
    user_id: uid,
    role: 'member' as const,
  }))
  const { error } = await supabase()
    .from('room_members')
    .upsert(rows, { onConflict: 'room_id,user_id' })
  if (error) throw error
}

export const startSession = async (
  roomId: string,
  currentUserId: string,
): Promise<RoomSession> => {
  const { data, error } = await supabase()
    .from('room_sessions')
    .insert({ room_id: roomId, started_by: currentUserId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const endSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase()
    .from('room_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('ended_at', null)
  if (error) throw error
}

export const getActiveSession = async (roomId: string): Promise<RoomSession | null> => {
  const { data, error } = await supabase()
    .from('room_sessions')
    .select('*')
    .eq('room_id', roomId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
