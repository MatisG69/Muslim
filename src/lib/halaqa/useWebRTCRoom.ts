'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { WebRTCMesh, type PeerInfo } from '@/lib/webrtc/mesh'
import { endSession, startSession } from './rooms'

type LiveState = 'idle' | 'connecting' | 'live' | 'error'

const HEARTBEAT_MS = 30_000

export const useWebRTCRoom = (roomId: string | null) => {
  const { user } = useAuth()
  const [liveState, setLiveState] = useState<LiveState>('idle')
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meshRef = useRef<WebRTCMesh | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const heartbeatRef = useRef<number | null>(null)

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current != null) {
      window.clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatRef.current = window.setInterval(() => {
      const id = sessionIdRef.current
      if (!id) return
      supabase()
        .from('room_sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[useWebRTCRoom] heartbeat error', error.message)
        })
    }, HEARTBEAT_MS)
  }, [stopHeartbeat])

  const join = useCallback(async () => {
    if (!user || !roomId) throw new Error('Non authentifié ou room manquante')
    if (meshRef.current) return

    setLiveState('connecting')
    setError(null)

    const mesh = new WebRTCMesh(roomId, user.id)
    meshRef.current = mesh

    mesh.on('peers-changed', updated => setPeers(new Map(updated)))
    mesh.on('local-stream', stream => setLocalStream(stream))
    mesh.on('error', err => {
      console.error('[useWebRTCRoom] mesh error', err)
      setError(err.message)
    })

    try {
      await mesh.join()
      setLiveState('live')

      // 1) Termine d'éventuelles sessions orphelines de ce user dans cette room
      try {
        await supabase()
          .from('room_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('started_by', user.id)
          .is('ended_at', null)
      } catch (e) {
        console.warn('[useWebRTCRoom] orphan cleanup failed', e)
      }

      // 2) Crée une nouvelle session pour ce user
      try {
        const created = await startSession(roomId, user.id)
        sessionIdRef.current = created.id
      } catch (e) {
        console.warn('[useWebRTCRoom] startSession failed', e)
      }

      // 3) Heartbeat pour signaler "encore live" au lobby
      startHeartbeat()
    } catch (e) {
      setLiveState('error')
      setError((e as Error).message)
      meshRef.current = null
      throw e
    }
  }, [user, roomId, startHeartbeat])

  const leave = useCallback(async () => {
    stopHeartbeat()
    const mesh = meshRef.current
    if (!mesh) {
      // Cas dégradé : pas de mesh mais peut-être une session pendante
      if (sessionIdRef.current) {
        try { await endSession(sessionIdRef.current) } catch {}
        sessionIdRef.current = null
      }
      return
    }
    meshRef.current = null

    await mesh.leave()
    setPeers(new Map())
    setLocalStream(null)
    setLiveState('idle')
    setMuted(false)

    if (sessionIdRef.current) {
      try {
        await endSession(sessionIdRef.current)
      } catch {}
      sessionIdRef.current = null
    }
  }, [stopHeartbeat])

  const toggleMute = useCallback(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const next = !muted
    mesh.setMuted(next)
    setMuted(next)
  }, [muted])

  useEffect(() => {
    return () => {
      stopHeartbeat()
      const id = sessionIdRef.current
      if (id) {
        // best-effort fire-and-forget
        endSession(id).catch(() => {})
        sessionIdRef.current = null
      }
      meshRef.current?.leave().catch(() => {})
      meshRef.current = null
    }
  }, [stopHeartbeat])

  return { liveState, peers, localStream, muted, error, join, leave, toggleMute }
}
