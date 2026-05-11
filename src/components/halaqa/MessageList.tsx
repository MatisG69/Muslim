'use client'

import { Play, Pause } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { getAudioUrl } from '@/lib/halaqa/messages'
import type { RoomMessage } from '@/lib/halaqa/types'
import { Avatar } from './Avatar'

type Props = {
  messages: RoomMessage[]
}

export const MessageList = ({ messages }: Props) => {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center py-12'>
        <p className='text-center text-xs text-ivory-100/40'>
          Aucun message. Lance la conversation 🕊
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-3 overflow-y-auto py-2'>
      {messages.map(m => (
        <MessageBubble key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

const MessageBubble = ({ message }: { message: RoomMessage }) => {
  const { user } = useAuth()
  const mine = user?.id === message.user_id

  return (
    <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!mine && <Avatar profile={message.author ?? null} size='sm' />}
      <div className='flex max-w-[78%] flex-col gap-1'>
        {!mine && message.author && (
          <span className='px-2 text-[10px] text-ivory-100/40'>{message.author.display_name}</span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            mine
              ? 'bg-gradient-to-b from-gold-300/20 to-gold-500/10 ring-1 ring-gold-400/30'
              : 'bg-white/[0.04] ring-1 ring-white/[0.06]'
          }`}
        >
          {message.kind === 'text' && (
            <p className='whitespace-pre-wrap text-sm text-ivory-50'>{message.content}</p>
          )}
          {message.kind === 'audio' && message.audio_path && (
            <AudioPlayer path={message.audio_path} durationMs={message.duration_ms} />
          )}
        </div>
      </div>
    </div>
  )
}

const AudioPlayer = ({ path, durationMs }: { path: string; durationMs: number | null }) => {
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let cancelled = false
    getAudioUrl(path).then(u => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => {})
    }
  }

  const seconds = durationMs ? Math.round(durationMs / 1000) : null
  const label = seconds != null ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '—'

  return (
    <div className='flex min-w-[140px] items-center gap-3'>
      <button
        type='button'
        onClick={toggle}
        disabled={!url}
        className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold-400/20 text-gold-200 ring-1 ring-gold-400/40 disabled:opacity-40'
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
      </button>
      <div className='flex flex-col'>
        <span className='text-[11px] text-ivory-100/60'>Audio</span>
        <span className='text-[10px] text-ivory-100/40'>{label}</span>
      </div>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload='none'
        />
      )}
    </div>
  )
}
