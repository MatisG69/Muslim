'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// =====================================================================
// useRoomLobby
//
// Observe en lecture seule les participants actuellement dans le live audio
// d'une room. Subscribe au même canal Realtime que le mesh WebRTC
// ("halaqa:{roomId}") SANS tracker sa propre présence — sert uniquement à
// afficher "X est en live, rejoindre ?" aux membres qui ne sont pas encore
// connectés.
// =====================================================================

export const useRoomLobby = (roomId: string | null) => {
  const [liveUserIds, setLiveUserIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!roomId) {
      setLiveUserIds(new Set())
      setReady(false)
      return
    }

    setReady(false)
    const sb = supabase()
    const channel = sb.channel(`halaqa:${roomId}`, {
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
      setLiveUserIds(ids)
    }

    channel
      .on('presence', { event: 'sync' }, updateState)
      .on('presence', { event: 'join' }, updateState)
      .on('presence', { event: 'leave' }, updateState)
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setReady(true)
          updateState()
        }
      })

    return () => {
      sb.removeChannel(channel)
    }
  }, [roomId])

  return { liveUserIds, ready }
}
