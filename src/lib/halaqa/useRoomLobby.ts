'use client'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// =====================================================================
// useRoomLobby
//
// Canal Realtime dédié à signaler "qui est actuellement en live audio"
// dans une room. Séparé du canal WebRTC (halaqa:{roomId}) pour éviter
// tout conflit entre instances de canal sur le même navigateur.
//
// Topologie :
//   - halaqa-lobby:{roomId}  → présence des participants en live
//   - halaqa:{roomId}        → signaling WebRTC (offers/answers/ICE)
//
// Tous les membres de la room qui ouvrent la page subscribe au lobby
// en lecture. Quand un membre démarre/rejoint le live, il appelle
// announce(userId). À la sortie, il appelle unannounce().
// =====================================================================

const log = (...args: unknown[]) => console.info('[Lobby]', ...args)

export const useRoomLobby = (roomId: string | null) => {
  const [liveUserIds, setLiveUserIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!roomId) {
      setLiveUserIds(new Set())
      setReady(false)
      return
    }

    setReady(false)
    const sb = supabase()
    const channelName = `halaqa-lobby:${roomId}`
    const channel = sb.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
      },
    })

    const updateState = () => {
      const state = channel.presenceState<{ user_id?: string }>()
      const ids = new Set<string>()
      Object.values(state).forEach(presences => {
        const uid = presences[0]?.user_id
        if (uid) ids.add(uid)
      })
      log('Presence update — liveUserIds:', Array.from(ids))
      setLiveUserIds(ids)
    }

    channel
      .on('presence', { event: 'sync' }, updateState)
      .on('presence', { event: 'join' }, updateState)
      .on('presence', { event: 'leave' }, updateState)
      .subscribe(status => {
        log(`Subscribe status on ${channelName}:`, status)
        if (status === 'SUBSCRIBED') {
          setReady(true)
          updateState()
        }
      })

    channelRef.current = channel

    return () => {
      log('Removing lobby channel', channelName)
      sb.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId])

  const announce = useCallback(async (userId: string) => {
    const ch = channelRef.current
    if (!ch) {
      log('announce(): channel not ready')
      return
    }
    log('announce()', userId)
    await ch.track({ user_id: userId, started_at: Date.now() })
  }, [])

  const unannounce = useCallback(async () => {
    const ch = channelRef.current
    if (!ch) return
    log('unannounce()')
    try {
      await ch.untrack()
    } catch {}
  }, [])

  return { liveUserIds, ready, announce, unannounce }
}
