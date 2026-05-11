'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  Circle,
  Droplets,
  Mic,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

type SheetItem = {
  href: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const ITEMS: SheetItem[] = [
  { href: '/tasbih', label: 'Tasbih', description: 'Compteur de dhikr', icon: Circle },
  { href: '/calendar', label: 'Calendrier', description: 'Hijri & grégorien', icon: CalendarDays },
  { href: '/ablutions', label: 'Ablutions', description: 'Guide étape par étape', icon: Droplets },
  { href: '/planner', label: 'Planning', description: 'Alarme Fajr de la semaine', icon: Sparkles },
  { href: '/recitation', label: 'Récitation', description: 'Bientôt — IA guidée', icon: Mic },
  { href: '/settings', label: 'Réglages', description: 'Préférences & compte', icon: SettingsIcon },
]

export const NavSheet = ({ open, onClose }: Props) => {
  const pathname = usePathname()

  // Ferme automatiquement à la navigation
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Verrouille le scroll body quand la sheet est ouverte
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type='button'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-label='Fermer'
            className='fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-md'
          />

          <motion.div
            role='dialog'
            aria-modal='true'
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            drag='y'
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose()
            }}
            className='fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-[28px] border-t border-white/[0.08] bg-gradient-to-b from-ink-800/95 to-ink-900/95 px-5 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-2xl shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.6)]'
          >
            <div
              className='pointer-events-none absolute inset-0 rounded-t-[28px] opacity-[0.04]'
              style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '160px' }}
              aria-hidden
            />

            <div className='relative'>
              <div className='mx-auto h-1 w-10 rounded-full bg-ivory-100/20' />

              <div className='mt-4 flex items-center justify-between'>
                <div>
                  <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Menu</p>
                  <h2 className='font-serif text-xl text-ivory-50'>Plus d&apos;outils</h2>
                </div>
                <button
                  type='button'
                  onClick={onClose}
                  aria-label='Fermer'
                  className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-ivory-100/60 ring-1 ring-white/10 hover:bg-white/[0.08]'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              <ul className='mt-5 grid grid-cols-2 gap-2 pb-4'>
                {ITEMS.map((item, i) => {
                  const Icon = item.icon
                  const active = pathname.startsWith(item.href)
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.05 + i * 0.04,
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`group flex h-full flex-col gap-2 rounded-2xl px-3.5 py-3.5 transition-colors ${
                          active
                            ? 'bg-gradient-to-b from-gold-400/[0.14] to-emerald-900/30 ring-1 ring-gold-400/40'
                            : 'bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            active
                              ? 'bg-gold-400/20 text-gold-200 ring-1 ring-gold-400/40'
                              : 'bg-white/[0.04] text-ivory-100/80 ring-1 ring-white/10 group-hover:text-gold-200'
                          }`}
                        >
                          <Icon className='h-4 w-4' />
                        </span>
                        <div>
                          <p className='text-sm font-medium text-ivory-50'>{item.label}</p>
                          <p className='text-[11px] text-ivory-100/50'>{item.description}</p>
                        </div>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
