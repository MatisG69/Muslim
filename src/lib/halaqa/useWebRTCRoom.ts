'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { WebRTCMesh, type PeerInfo } from '@/lib/webrtc/mesh'
import { endSession, getActiveSession, startSession } from './rooms'

type LiveState = 'idle' | 'connecting' | 'live' | 'error'

export const useWebRTCRoom = (roomId: string | null) => {
  const { user } = useAuth()
  const [liveState, setLiveState] = useState<LiveState>('idle')
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meshRef = useRef<WebRTCMesh | null>(null)
  const sessionIdRef = useRef<string | null>(null)

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

      // Marque ou rejoint une session live côté DB (best-effort)
      try {
        const active = await getActiveSession(roomId)
        if (active) {
          sessionIdRef.current = active.id
        } else {
          const created = await startSession(roomId, user.id)
          sessionIdRef.current = created.id
        }
      } catch (e) {
        console.warn('[useWebRTCRoom] session tracking failed', e)
      }
    } catch (e) {
      setLiveState('error')
      setError((e as Error).message)
      meshRef.current = null
      throw e
    }
  }, [user, roomId])

  const leave = useCallback(async () => {
    const mesh = meshRef.current
    if (!mesh) return
    meshRef.current = null

    await mesh.leave()
    setPeers(new Map())
    setLocalStream(null)
    setLiveState('idle')
    setMuted(false)

    // Si je suis le dernier (aucun peer restant côté DB), je clôture la session
    if (sessionIdRef.current) {
      try {
        await endSession(sessionIdRef.current)
      } catch {}
      sessionIdRef.current = null
    }
  }, [])

  const toggleMute = useCallback(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const next = !muted
    mesh.setMuted(next)
    setMuted(next)
  }, [muted])

  useEffect(() => {
    return () => {
      meshRef.current?.leave().catch(() => {})
      meshRef.current = null
    }
  }, [])

  return { liveState, peers, localStream, muted, error, join, leave, toggleMute }
}
