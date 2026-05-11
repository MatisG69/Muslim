'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { getProfilesByIds } from './profiles'
import {
  listRoomMessages,
  sendAudioMessage as sendAudioService,
  sendTextMessage as sendTextService,
} from './messages'
import type { RoomMessage } from './types'

export const useRoomMessages = (roomId: string | null) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!roomId) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await listRoomMessages(roomId)
      setMessages(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!roomId) return
    const sb = supabase()
    const channel = sb
      .channel(`room-msgs:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async payload => {
          const raw = payload.new as RoomMessage
          const profiles = await getProfilesByIds([raw.user_id])
          setMessages(prev => {
            if (prev.some(m => m.id === raw.id)) return prev
            return [...prev, { ...raw, author: profiles.get(raw.user_id) ?? null }]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          const removed = payload.old as Partial<RoomMessage>
          if (!removed.id) return
          setMessages(prev => prev.filter(m => m.id !== removed.id))
        },
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [roomId])

  const sendText = useCallback(
    async (content: string) => {
      if (!user || !roomId) throw new Error('Indisponible')
      await sendTextService(roomId, user.id, content)
    },
    [user, roomId],
  )

  const sendAudio = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!user || !roomId) throw new Error('Indisponible')
      await sendAudioService(roomId, user.id, blob, durationMs)
    },
    [user, roomId],
  )

  return { messages, loading, error, refresh, sendText, sendAudio }
}
