'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { getProfile } from '@/lib/halaqa/profiles'

const SESSION_KEY = 'sajda.splash.shown'
const HOLD_MS = 2400
const FADE_MS = 600

const firstName = (raw: string | null | undefined): string => {
  if (!raw) return ''
  const cleaned = raw.trim().split(/[\s_-]+/)[0]
  if (!cleaned) return ''
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export const SplashGreeting = () => {
  // Visible par défaut dès le rendu serveur. Le script inline du <head>
  // ajoute la classe `splash-skip` au <html> si le splash a déjà été vu
  // dans cette session, ce qui le masque via CSS avant tout paint.
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)

  const { user, configured } = useAuth()

  // Marque la session comme "splash déjà vu" dès le mount + planifie le fade-out
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {}

    const id = window.setTimeout(() => setExiting(true), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [])

  // Récupère le display_name du profil halaqa en arrière-plan
  useEffect(() => {
    if (!user || !configured) return
    let cancelled = false
    getProfile(user.id)
      .then(p => {
        if (!cancelled) setProfileName(p?.display_name ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, configured])

  const displayedName = useMemo(() => {
    return firstName(profileName) || firstName(user?.email?.split('@')[0]) || ''
  }, [profileName, user])

  if (!visible) return null

  return (
    <AnimatePresence
      onExitComplete={() => {
        setVisible(false)
        setExiting(false)
      }}
    >
      {!exiting && (
        <motion.div
          key='splash'
          data-splash
          role='dialog'
          aria-label='Bienvenue'
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setExiting(true)}
          className='fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-gradient-to-b from-ink-900 via-emerald-950 to-ink-900'
        >
          {/* Motif arabesque subtil */}
          <motion.div
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className='pointer-events-none absolute inset-0'
            style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '220px' }}
            aria-hidden
          />

          {/* Halo doré central */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className='pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-gold-400/[0.10] blur-3xl'
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 2, delay: 0.3 }}
            className='pointer-events-none absolute h-[260px] w-[260px] rounded-full bg-emerald-600/20 blur-3xl'
            aria-hidden
          />

          <div className='relative flex flex-col items-center gap-6 px-8 text-center'>
            {/* Étoile centrale qui s'épanouit */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className='relative flex h-16 w-16 items-center justify-center'
              aria-hidden
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className='absolute h-full w-full'
              >
                <Ornament />
              </motion.span>
              <span className='absolute h-2 w-2 rounded-full bg-gold-300 shadow-[0_0_24px_8px_rgba(212,169,87,0.5)]' />
            </motion.div>

            {/* Salutation arabe */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className='font-arabic text-3xl leading-tight text-gold-200 sm:text-4xl'
              dir='rtl'
            >
              السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
            </motion.p>

            {/* Translittération */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className='max-w-xs text-center text-sm italic tracking-wide text-ivory-100/70 sm:text-base'
            >
              Salaam alaykum wa rahmatullahi wa barakatuh
            </motion.p>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              className='divider-ornate w-40 origin-center'
            />

            {/* Nom de l'utilisateur */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className='flex flex-col items-center gap-1'
            >
              {displayedName ? (
                <>
                  <span className='text-[10px] uppercase tracking-[0.45em] text-gold-300/60'>
                    Marhaban
                  </span>
                  <span className='font-serif text-3xl text-ivory-50 sm:text-4xl'>
                    {displayedName}
                  </span>
                </>
              ) : (
                <span className='text-[10px] uppercase tracking-[0.45em] text-gold-300/60'>
                  Sajda
                </span>
              )}
            </motion.div>
          </div>

          {/* Hint discret pour skip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className='absolute bottom-[max(env(safe-area-inset-bottom),24px)] text-[10px] uppercase tracking-[0.4em] text-ivory-100/40'
          >
            Tapez pour entrer
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Ornament = () => (
  <svg viewBox='0 0 64 64' className='h-full w-full text-gold-300'>
    <g fill='none' stroke='currentColor' strokeWidth='1' strokeLinecap='round'>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4
        const x1 = 32 + Math.cos(angle) * 10
        const y1 = 32 + Math.sin(angle) * 10
        const x2 = 32 + Math.cos(angle) * 28
        const y2 = 32 + Math.sin(angle) * 28
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity={0.7} />
      })}
      <circle cx='32' cy='32' r='10' opacity={0.5} />
      <circle cx='32' cy='32' r='18' opacity={0.3} strokeDasharray='2 4' />
    </g>
  </svg>
)
