'use client'

import { Camera, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  onCapture: (dataUrl: string) => void
  disabled?: boolean
}

export const CameraCapture = ({ onCapture, disabled }: Props) => {
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
