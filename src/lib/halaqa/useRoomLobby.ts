'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// =====================================================================
// useRoomLobby
//
// Source de vérité = table room_sessions filtrée par room.
// Un user est "live" si une de ses room_sessions a ended_at IS NULL et
// started_at récent (< STALE_MS). Le mesh WebRTC alimente cette table
// via startSession/endSession + heartbeat.
//
// Avantage vs presence Realtime : DB-backed, RLS-protected, fiable même
// quand la propagation presence est bridée par la config Supabase.
// =====================================================================

const log = (...args: unknown[]) => console.info('[Lobby]', ...args)
const STALE_MS = 120_000 // 2 min — passé ce délai sans heartbeat, on considère orphan

export const useRoomLobby = (roomId: string | null) => {
  const [liveUserIds, setLiveUserIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!roomId) {
      setLiveUserIds(new Set())
      setReady(false)
      return
    }

    const sb = supabase()
    let cancelled = false

    const refresh = async () => {
      const cutoff = new Date(Date.now() - STALE_MS).toISOString()
      const { data, error } = await sb
        .from('room_sessions')
        .select('started_by, started_at, ended_at')
        .eq('room_id', roomId)
        .is('ended_at', null)
        .gte('started_at', cutoff)

      if (cancelled) return
      if (error) {
        log('refresh error', error.message)
        return
      }

      const ids = new Set<string>((data ?? []).map(r => r.started_by as string))
      log('refresh — liveUserIds:', Array.from(ids))
      setLiveUserIds(ids)
    }

    refresh().finally(() => {
      if (!cancelled) setReady(true)
    })

    const channelName = `lobby-sessions:${roomId}`
    const channel = sb
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          log('postgres_changes', payload.eventType)
          refresh()
        },
      )
      .subscribe(status => log(`Subscribe ${channelName}:`, status))

    // Poll de secours : revalide toutes les 30s pour expirer les orphelins
    const pollId = window.setInterval(refresh, 30_000)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      sb.removeChannel(channel)
    }
  }, [roomId])

  // Stubs (l'API reste compatible avec l'ancien LiveSessionPanel)
  const announce = useCallback(async () => {}, [])
  const unannounce = useCallback(async () => {}, [])

  return { liveUserIds, ready, announce, unannounce }
}
