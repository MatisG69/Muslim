'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AdhanPlayer } from '@/lib/audio/adhanPlayer'
import { useWakeLock } from '@/lib/hooks/useWakeLock'
import { CameraCapture } from './CameraCapture'

type VerifyResponse = {
  is_prayer_rug: boolean
  confidence: number
  reason: string
}

type Phase = 'arming' | 'ringing' | 'verifying' | 'rejected' | 'accepted'

type Props = {
  open: boolean
  adhanSrc: string
  volume: number
  onDismiss: () => void
}

export const AlarmOverlay = ({ open, adhanSrc, volume, onDismiss }: Props) => {
  const playerRef = useRef<AdhanPlayer | null>(null)
  const [phase, setPhase] = useState<Phase>('arming')
  const [lastReason, setLastReason] = useState<string | null>(null)

  useWakeLock(open && phase === 'ringing')

  useEffect(() => {
    if (!open) {
      playerRef.current?.stop()
      playerRef.current = null
      setPhase('arming')
      setLastReason(null)
      return
    }
  }, [open])

  const arm = async () => {
    if (!playerRef.current) playerRef.current = new AdhanPlayer()
    await playerRef.current.start(adhanSrc, volume)
    setPhase('ringing')
  }

  const handleCapture = async (dataUrl: string) => {
    setPhase('verifying')
    try {
      const res = await fetch('/api/verify-rug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (!res.ok) {
        setLastReason('Erreur de vérification, réessayez.')
        setPhase('rejected')
        return
      }
      const data: VerifyResponse = await res.json()
      if (data.is_prayer_rug && data.confidence >= 0.7) {
        playerRef.current?.stop()
        setPhase('accepted')
        setTimeout(onDismiss, 1800)
      } else {
        setLastReason(data.reason || 'Ce n’est pas un tapis de prière.')
        setPhase('rejected')
      }
    } catch {
      setLastReason('Connexion impossible.')
      setPhase('rejected')
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className='fixed inset-0 z-50 overflow-y-auto bg-fajr'
      >
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.08]'
          style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '200px' }}
          aria-hidden
        />

        <div className='relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10'>
          {phase === 'arming' && <ArmView onArm={arm} />}
          {phase === 'ringing' && <RingView onCapture={handleCapture} />}
          {phase === 'verifying' && <VerifyingView />}
          {phase === 'rejected' && (
            <RejectedView reason={lastReason ?? ''} onRetry={() => setPhase('ringing')} />
          )}
          {phase === 'accepted' && <AcceptedView />}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const ArmView = ({ onArm }: { onArm: () => void }) => (
  <div className='m-auto flex flex-col items-center gap-8 text-center'>
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className='h-32 w-32 rounded-full border border-gold-300/40 bg-gold-300/[0.04]'
        style={{ backgroundImage: 'url(/patterns/mihrab.svg)', backgroundSize: 'contain' }}
      />
    </motion.div>
    <div>
      <p className='font-arabic text-3xl text-gold-200/90' dir='rtl'>الصلاة خير من النوم</p>
      <p className='mt-2 text-sm text-ivory-100/70'>« La prière est meilleure que le sommeil »</p>
    </div>
    <h1 className='font-serif text-4xl text-ivory-50'>L'heure du Fajr</h1>
    <button onClick={onArm} className='btn-primary px-8 py-4 text-base'>
      Lancer l'Adhan
    </button>
    <p className='max-w-xs text-xs text-ivory-100/50'>
      Tapotez pour activer le son. L'alarme ne s'arrêtera que par une photo de votre tapis de prière.
    </p>
  </div>
)

const RingView = ({ onCapture }: { onCapture: (d: string) => void }) => (
  <div className='flex flex-col gap-6'>
    <div className='flex flex-col items-center pt-4 text-center'>
      <div className='relative'>
        <div className='alarm-pulse absolute -inset-6 rounded-full bg-gold-400/20 blur-2xl' />
        <div className='relative flex h-20 w-20 items-center justify-center rounded-full border border-gold-300/50 bg-gold-300/10'>
          <span className='font-arabic text-2xl text-gold-100' dir='rtl'>الفجر</span>
        </div>
      </div>
      <h1 className='mt-5 font-serif text-3xl text-ivory-50'>Adhan en cours</h1>
      <p className='mt-1 text-sm text-ivory-100/70'>
        Photographiez votre tapis de prière pour arrêter
      </p>
    </div>
    <CameraCapture onCapture={onCapture} />
    <p className='mx-auto mt-2 max-w-xs text-center text-[11px] text-ivory-100/40'>
      Mur, sol nu, visage : refusés. Le tapis doit être clairement visible.
    </p>
  </div>
)

const VerifyingView = () => (
  <div className='m-auto flex flex-col items-center gap-5 text-center'>
    <Loader2 className='h-12 w-12 animate-spin text-gold-300' />
    <p className='font-serif text-2xl text-ivory-50'>Vérification...</p>
    <p className='text-sm text-ivory-100/60'>Analyse de votre photo</p>
  </div>
)

const RejectedView = ({ reason, onRetry }: { reason: string; onRetry: () => void }) => (
  <div className='m-auto flex max-w-sm flex-col items-center gap-5 text-center'>
    <div className='flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/10'>
      <AlertCircle className='h-8 w-8 text-rose-300' />
    </div>
    <h2 className='font-serif text-2xl text-ivory-50'>Photo refusée</h2>
    <p className='text-sm text-ivory-100/70'>{reason}</p>
    <button onClick={onRetry} className='btn-primary'>
      Réessayer
    </button>
  </div>
)

const AcceptedView = () => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className='m-auto flex flex-col items-center gap-5 text-center'
  >
    <div className='flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10'>
      <CheckCircle2 className='h-10 w-10 text-emerald-300' />
    </div>
    <h2 className='font-serif text-3xl text-ivory-50'>Que ta prière soit acceptée</h2>
    <p className='font-arabic text-xl text-gold-200/80' dir='rtl'>تقبل الله منا ومنكم</p>
  </motion.div>
)
