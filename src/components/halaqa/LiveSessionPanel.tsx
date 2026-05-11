'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff, Radio } from 'lucide-react'
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useWebRTCRoom } from '@/lib/halaqa/useWebRTCRoom'
import type { PeerInfo } from '@/lib/webrtc/mesh'
import type { RoomWithMembers } from '@/lib/halaqa/types'
import { PeerAudioTile } from './PeerAudioTile'

type Props = {
  room: RoomWithMembers
}

export const LiveSessionPanel = ({ room }: Props) => {
  const { user } = useAuth()
  const { liveState, peers, muted, error, join, leave, toggleMute, localStream } =
    useWebRTCRoom(room.id)

  const memberMap = useMemo(() => {
    const map = new Map<string, RoomWithMembers['members'][number]['profile']>()
    for (const m of room.members) map.set(m.user_id, m.profile)
    if (room.owner) map.set(room.owner_id, room.owner)
    return map
  }, [room])

  const localPeer: PeerInfo = {
    userId: user?.id ?? 'me',
    state: 'connected',
    stream: localStream,
    muted,
  }

  if (liveState === 'idle') {
    return (
      <div className='card flex flex-col items-center gap-4 px-6 py-8 text-center'>
        <span className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/15 ring-1 ring-gold-400/40'>
          <Radio className='h-5 w-5 text-gold-200' />
        </span>
        <div>
          <h3 className='font-serif text-xl text-ivory-50'>Session live</h3>
          <p className='mt-1 text-xs text-ivory-100/60'>
            Rejoins la halaqa en direct pour réciter ou échanger.
          </p>
        </div>
        <button type='button' onClick={join} className='btn-primary text-sm'>
          <Mic className='h-4 w-4' />
          Démarrer le live
        </button>
      </div>
    )
  }

  if (liveState === 'connecting') {
    return (
      <div className='card flex flex-col items-center gap-3 py-8 text-center'>
        <span className='inline-block h-2 w-2 animate-pulse rounded-full bg-gold-300' />
        <p className='text-xs text-ivory-100/60'>Connexion au micro…</p>
      </div>
    )
  }

  if (liveState === 'error') {
    return (
      <div className='card flex flex-col items-center gap-3 px-6 py-6 text-center'>
        <p className='text-xs text-rose-300'>{error ?? 'Erreur micro / réseau'}</p>
        <button type='button' onClick={join} className='btn-ghost text-xs'>
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className='card relative overflow-hidden px-5 py-6'>
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.05]'
        style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '160px' }}
        aria-hidden
      />
      <div className='relative flex flex-col gap-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400' />
            <span className='text-[10px] uppercase tracking-[0.3em] text-emerald-200/80'>
              En direct
            </span>
          </div>
          <span className='text-[11px] text-ivory-100/50'>
            {peers.size + 1} participant{peers.size + 1 > 1 ? 's' : ''}
          </span>
        </div>

        <div className='grid grid-cols-3 gap-4'>
          <PeerAudioTile peer={localPeer} profile={memberMap.get(user?.id ?? '') ?? null} isLocal muted={muted} />
          <AnimatePresence>
            {Array.from(peers.values()).map(p => (
              <PeerAudioTile
                key={p.userId}
                peer={p}
                profile={memberMap.get(p.userId) ?? null}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className='flex items-center justify-center gap-3 pt-2'>
          <motion.button
            type='button'
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full ring-1 transition-colors ${
              muted
                ? 'bg-rose-500/20 text-rose-200 ring-rose-400/40'
                : 'bg-white/[0.04] text-ivory-100/80 ring-white/10'
            }`}
            aria-label={muted ? 'Réactiver le micro' : 'Couper le micro'}
          >
            {muted ? <MicOff className='h-5 w-5' /> : <Mic className='h-5 w-5' />}
          </motion.button>
          <motion.button
            type='button'
            whileTap={{ scale: 0.95 }}
            onClick={leave}
            className='inline-flex h-12 items-center gap-2 rounded-full bg-rose-500/20 px-5 text-sm text-rose-100 ring-1 ring-rose-400/40 hover:bg-rose-500/30'
          >
            <PhoneOff className='h-4 w-4' />
            Quitter
          </motion.button>
        </div>
      </div>
    </div>
  )
}
