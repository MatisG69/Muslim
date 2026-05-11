'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import {
  createRoom as createRoomService,
  type CreateRoomInput,
  getRoom,
  listMyRooms,
} from './rooms'
import type { Room, RoomWithMembers } from './types'

export const useRooms = () => {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setRooms([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await listMyRooms(user.id)
      setRooms(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) return
    const sb = supabase()
    const channel = sb
      .channel(`my-rooms:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => refresh())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [user, refresh])

  const create = useCallback(
    async (input: CreateRoomInput) => {
      if (!user) throw new Error('Non authentifié')
      const room = await createRoomService(user.id, input)
      await refresh()
      return room
    },
    [user, refresh],
  )

  return { rooms, loading, error, refresh, create }
}

export const useRoom = (roomId: string | null) => {
  const [room, setRoom] = useState<RoomWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getRoom(roomId)
      setRoom(data)
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
      .channel(`room-detail:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [roomId, refresh])

  return { room, loading, error, refresh }
}
