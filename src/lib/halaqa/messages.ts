'use client'

import { supabase } from '@/lib/supabase/client'
import { getProfilesByIds } from './profiles'
import type { RoomMessage } from './types'

const BUCKET = 'room-audio'

export const listRoomMessages = async (
  roomId: string,
  limit = 100,
): Promise<RoomMessage[]> => {
  const { data, error } = await supabase()
    .from('room_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error

  const rows = data ?? []
  const authorIds = Array.from(new Set(rows.map(r => r.user_id)))
  const profiles = await getProfilesByIds(authorIds)

  return rows.map(r => ({ ...r, author: profiles.get(r.user_id) ?? null }))
}

export const sendTextMessage = async (
  roomId: string,
  userId: string,
  content: string,
): Promise<RoomMessage> => {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Message vide')
  const { data, error } = await supabase()
    .from('room_messages')
    .insert({ room_id: roomId, user_id: userId, kind: 'text', content: trimmed })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const sendAudioMessage = async (
  roomId: string,
  userId: string,
  blob: Blob,
  durationMs: number,
): Promise<RoomMessage> => {
  const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'webm'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const path = `${roomId}/${filename}`

  const { error: upErr } = await supabase()
    .storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'audio/webm',
      upsert: false,
    })
  if (upErr) throw upErr

  const { data, error } = await supabase()
    .from('room_messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      kind: 'audio',
      audio_path: path,
      duration_ms: Math.round(durationMs),
    })
    .select('*')
    .single()
  if (error) {
    // best-effort cleanup
    await supabase().storage.from(BUCKET).remove([path]).catch(() => {})
    throw error
  }
  return data
}

export const getAudioUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase()
    .storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60)
  if (error) return null
  return data?.signedUrl ?? null
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase().from('room_messages').delete().eq('id', messageId)
  if (error) throw error
}
