'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PeerInfo } from '@/lib/webrtc/mesh'
import type { Profile } from '@/lib/halaqa/types'
import { Avatar } from './Avatar'

type Props = {
  peer: PeerInfo
  profile: Profile | null
  isLocal?: boolean
  muted?: boolean
}

export const PeerAudioTile = ({ peer, profile, isLocal, muted }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (isLocal) return
    const el = audioRef.current
    if (!el || !peer.stream) return
    el.srcObject = peer.stream
    el.play().catch(() => {})
    return () => {
      try {
        el.srcObject = null
      } catch {}
    }
  }, [peer.stream, isLocal])

  // Détection simple de parole via AudioContext + AnalyserNode
  useEffect(() => {
    if (!peer.stream) return
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioCtx.createMediaStreamSource(peer.stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const buffer = new Uint8Array(analyser.frequencyBinCount)
    let raf = 0
    const tick = () => {
      analyser.getByteFrequencyData(buffer)
      let sum = 0
      for (let i = 0; i < buffer.length; i++) sum += buffer[i]
      const avg = sum / buffer.length
      setSpeaking(avg > 16)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      try {
        source.disconnect()
        audioCtx.close()
      } catch {}
    }
  }, [peer.stream])

  const displayName = isLocal
    ? 'Toi'
    : profile?.display_name ?? peer.userId.slice(0, 6)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className='relative flex flex-col items-center gap-2'
    >
      <div className='relative'>
        {speaking && (
          <motion.span
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className='absolute -inset-2 rounded-full bg-gold-400/30'
            aria-hidden
          />
        )}
        <Avatar profile={profile} size='xl' className='relative ring-2 ring-gold-400/30' />
        <span
          className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-ink-900 ${
            peer.state === 'connected' || isLocal
              ? muted
                ? 'bg-rose-500/80 text-ivory-50'
                : 'bg-emerald-600 text-ivory-50'
              : peer.state === 'failed'
                ? 'bg-rose-600 text-ivory-50'
                : 'bg-ink-800 text-ivory-100/60'
          }`}
        >
          {peer.state === 'failed' ? (
            <AlertCircle className='h-3.5 w-3.5' />
          ) : peer.state !== 'connected' && !isLocal ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : muted ? (
            <MicOff className='h-3.5 w-3.5' />
          ) : (
            <Mic className='h-3.5 w-3.5' />
          )}
        </span>
      </div>
      <p className='max-w-[6rem] truncate text-center text-xs text-ivory-50'>{displayName}</p>
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
    </motion.div>
  )
}
