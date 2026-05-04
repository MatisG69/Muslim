'use client'

import { Camera, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  onCapture: (dataUrl: string) => void
  disabled?: boolean
  qiblaOverlay?: {
    qiblaBearing: number
    deviceHeading: number | null
    onActivate?: () => void
  }
}

export const CameraCapture = ({ onCapture, disabled, qiblaOverlay }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const startStream = async (mode: 'user' | 'environment') => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setReady(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Caméra inaccessible')
    }
  }

  useEffect(() => {
    startStream(facingMode)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [facingMode])

  const capture = () => {
    const video = videoRef.current
    if (!video || !ready) return
    const w = video.videoWidth
    const h = video.videoHeight
    const size = Math.min(w, h)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, (w - size) / 2, (h - size) / 2, size, size, 0, 0, size, size)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    onCapture(dataUrl)
  }

  return (
    <div className='relative w-full'>
      <div className='relative aspect-square overflow-hidden rounded-3xl border border-gold-400/30 bg-ink-900'>
        {error ? (
          <div className='flex h-full items-center justify-center px-6 text-center text-ivory-100/70'>
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className='h-full w-full object-cover'
            />
            <div className='pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold-400/20' />
            <div className='pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed border-gold-300/30' />
            {qiblaOverlay && <QiblaOverlay {...qiblaOverlay} />}
          </>
        )}
      </div>

      <div className='mt-6 flex items-center justify-center gap-3'>
        <button
          onClick={() => setFacingMode(m => (m === 'user' ? 'environment' : 'user'))}
          className='btn-ghost'
          type='button'
          aria-label='Changer de caméra'
        >
          <RotateCcw className='h-4 w-4' />
        </button>
        <button
          onClick={capture}
          disabled={disabled || !ready}
          className='btn-primary px-8 py-4 text-base disabled:opacity-50'
          type='button'
        >
          <Camera className='h-5 w-5' />
          Capturer
        </button>
      </div>
    </div>
  )
}

const QiblaOverlay = ({
  qiblaBearing,
  deviceHeading,
  onActivate,
}: {
  qiblaBearing: number
  deviceHeading: number | null
  onActivate?: () => void
}) => {
  const heading = deviceHeading ?? 0
  const angleDelta = ((qiblaBearing - heading + 540) % 360) - 180
  const aligned = Math.abs(angleDelta) < 10
  const arrowRotation = qiblaBearing - heading
  const wasAlignedRef = useRef(false)

  useEffect(() => {
    if (aligned && !wasAlignedRef.current && 'vibrate' in navigator) {
      navigator.vibrate([20, 60, 30])
    }
    wasAlignedRef.current = aligned
  }, [aligned])

  if (deviceHeading == null) {
    return (
      <div
        className='absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-ink-900/60 via-transparent to-ink-900/40'
      >
        <button
          type='button'
          onClick={onActivate}
          className='flex flex-col items-center gap-3 rounded-3xl bg-ink-900/85 px-7 py-5 backdrop-blur-md ring-1 ring-gold-400/40'
        >
          <svg viewBox='0 0 40 40' className='h-10 w-10'>
            <circle cx='20' cy='20' r='16' fill='none' stroke='#d4a957' strokeWidth='1.5' opacity='0.6' />
            <path d='M 20 8 L 24 18 L 20 16 L 16 18 Z' fill='#d4a957' />
            <circle cx='20' cy='20' r='2.5' fill='#d4a957' />
          </svg>
          <p className='text-xs uppercase tracking-[0.25em] text-gold-300'>Activer la boussole</p>
          <p className='max-w-[200px] text-center text-[10px] text-ivory-100/60'>
            Pour voir la direction de la Qibla pendant la photo
          </p>
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className={`absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium backdrop-blur-md transition-colors ${
          aligned
            ? 'bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/60'
            : 'bg-ink-900/80 text-gold-200 ring-1 ring-gold-400/30'
        }`}
      >
        {aligned ? (
          <>
            <span className='font-arabic text-base'>✓</span>
            <span>Face à la Qibla</span>
          </>
        ) : (
          <>
            <span className='font-serif text-base tabular-nums'>{Math.round(Math.abs(angleDelta))}°</span>
            <span className='text-[10px] uppercase tracking-widest'>
              {angleDelta > 0 ? '↻ tournez à droite' : '↺ tournez à gauche'}
            </span>
          </>
        )}
      </div>

      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 z-20 h-44 w-44 -translate-x-1/2 -translate-y-1/2 transition-all ${
          aligned ? 'scale-110' : 'scale-100'
        }`}
      >
        <svg viewBox='0 0 100 100' className='h-full w-full drop-shadow-[0_0_12px_rgba(212,169,87,0.4)]'>
          <defs>
            <linearGradient id='cam-arrow-gold' x1='50%' y1='0%' x2='50%' y2='100%'>
              <stop offset='0%' stopColor='#f6ecd0' />
              <stop offset='100%' stopColor='#d4a957' />
            </linearGradient>
            <linearGradient id='cam-arrow-green' x1='50%' y1='0%' x2='50%' y2='100%'>
              <stop offset='0%' stopColor='#a7f3d0' />
              <stop offset='100%' stopColor='#34d399' />
            </linearGradient>
            <radialGradient id='cam-ring-fill' cx='50%' cy='50%' r='50%'>
              <stop offset='75%' stopColor='transparent' />
              <stop offset='100%' stopColor='rgba(0,0,0,0.35)' />
            </radialGradient>
          </defs>

          <circle cx='50' cy='50' r='44' fill='url(#cam-ring-fill)' />
          <circle
            cx='50'
            cy='50'
            r='42'
            fill='none'
            stroke={aligned ? 'rgba(52,211,153,0.7)' : 'rgba(212,169,87,0.55)'}
            strokeWidth='1.2'
            strokeDasharray={aligned ? 'none' : '2 3'}
          />
          <circle cx='50' cy='50' r='36' fill='none' stroke={aligned ? 'rgba(52,211,153,0.4)' : 'rgba(245,239,230,0.18)'} strokeWidth='0.5' />

          <line x1='50' y1='4' x2='50' y2='14' stroke='#f87171' strokeWidth='2.5' strokeLinecap='round' opacity={aligned ? 0 : 0.9} />
          <line x1='50' y1='4' x2='50' y2='14' stroke='#34d399' strokeWidth='2.5' strokeLinecap='round' opacity={aligned ? 1 : 0} />

          <g
            style={{
              transform: `rotate(${arrowRotation}deg)`,
              transformOrigin: '50px 50px',
              transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <line
              x1='50'
              y1='50'
              x2='50'
              y2='22'
              stroke={aligned ? '#34d399' : '#d4a957'}
              strokeWidth='1.2'
              opacity='0.4'
            />
            <path
              d='M 50 12 L 58 30 L 50 26 L 42 30 Z'
              fill={aligned ? 'url(#cam-arrow-green)' : 'url(#cam-arrow-gold)'}
              stroke={aligned ? '#34d399' : '#d4a957'}
              strokeWidth='0.5'
            />
          </g>

          <circle cx='50' cy='50' r='6' fill='#0a1410' stroke={aligned ? '#34d399' : '#d4a957'} strokeWidth='1' />
          <text
            x='50'
            y='53'
            textAnchor='middle'
            fontSize='5'
            fill={aligned ? '#34d399' : '#d4a957'}
            fontFamily='serif'
          >
            ﷽
          </text>
        </svg>
      </div>

      <div className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink-900/75 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory-100/70 backdrop-blur-md'>
        Cap {Math.round(heading)}° → Qibla {Math.round(qiblaBearing)}°
      </div>
    </>
  )
}
