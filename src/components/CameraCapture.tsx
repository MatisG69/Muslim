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

  if (deviceHeading == null) {
    return (
      <button
        type='button'
        onClick={onActivate}
        className='absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-ink-900/85 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold-300 backdrop-blur-sm'
      >
        Activer la boussole
      </button>
    )
  }

  return (
    <>
      <div
        className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest backdrop-blur-md ${
          aligned ? 'bg-emerald-500/30 text-emerald-200' : 'bg-ink-900/70 text-gold-300/90'
        }`}
      >
        {aligned ? '✓ Face à la Qibla' : `${Math.round(Math.abs(angleDelta))}° ${angleDelta > 0 ? 'à droite' : 'à gauche'}`}
      </div>
      <svg
        viewBox='0 0 100 100'
        className='pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2'
      >
        <circle cx='50' cy='50' r='32' fill='none' stroke={aligned ? 'rgba(52,211,153,0.5)' : 'rgba(212,169,87,0.4)'} strokeWidth='1' />
        <g
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            transformOrigin: '50px 50px',
            transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <path
            d='M 50 16 L 56 32 L 50 28 L 44 32 Z'
            fill={aligned ? '#34d399' : '#d4a957'}
            stroke={aligned ? '#34d399' : '#d4a957'}
            strokeWidth='0.5'
          />
          <line
            x1='50'
            y1='32'
            x2='50'
            y2='50'
            stroke={aligned ? '#34d399' : '#d4a957'}
            strokeWidth='1'
            opacity='0.6'
          />
        </g>
        <circle cx='50' cy='50' r='3' fill={aligned ? '#34d399' : '#d4a957'} />
      </svg>
    </>
  )
}
