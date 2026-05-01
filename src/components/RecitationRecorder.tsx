'use client'

import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

type Props = {
  isRecording: boolean
  onStart: () => void
  onStop: () => void
  status: string
  disabled?: boolean
}

export const RecitationRecorder = ({ isRecording, onStart, onStop, status, disabled }: Props) => {
  return (
    <div className='flex flex-col items-center gap-3'>
      <button
        type='button'
        onClick={isRecording ? onStop : onStart}
        disabled={disabled}
        className='relative flex h-24 w-24 items-center justify-center rounded-full focus:outline-none disabled:opacity-50'
        aria-label={isRecording ? 'Arrêter la récitation' : 'Démarrer la récitation'}
      >
        {isRecording && (
          <>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='absolute inset-0 rounded-full bg-rose-400/40'
            />
            <motion.span
              animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              className='absolute inset-0 rounded-full bg-rose-400/30'
            />
          </>
        )}
        <span
          className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-colors ${
            isRecording
              ? 'bg-gradient-to-b from-rose-400 to-rose-600 text-ivory-50 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.6)]'
              : 'bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-[0_8px_30px_-8px_rgba(212,169,87,0.6)]'
          }`}
        >
          {isRecording ? <Square className='h-7 w-7' /> : <Mic className='h-8 w-8' />}
        </span>
      </button>
      <p className='text-center text-xs text-ivory-100/60'>{status}</p>
    </div>
  )
}
