'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Sunrise } from 'lucide-react'
import { TIME_BASED_PRAYERS } from '@/data/sunnah-prayers'
import type { SunnahWindows } from '@/lib/hooks/usePrayerTimes'

type Props = {
  windows: SunnahWindows
}

const formatHm = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const ICONS = {
  duha: Sunrise,
  witr: Moon,
  tahajjud: Moon,
  tahiyyat: Sun,
} as const

const isInWindow = (now: Date, start: Date, end: Date): boolean =>
  now.getTime() >= start.getTime() && now.getTime() <= end.getTime()

export const SunnahPrayersCard = ({ windows }: Props) => {
  const now = new Date()

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className='card overflow-hidden'
    >
      <header className='flex items-center justify-between px-6 pt-5 pb-3'>
        <span className='text-xs uppercase tracking-[0.3em] text-gold-300/70'>
          Prières surérogatoires
        </span>
        <span className='font-arabic text-sm text-gold-300/60'>صلوات النوافل</span>
      </header>

      <ul className='divide-y divide-white/[0.05]'>
        {TIME_BASED_PRAYERS.map(p => {
          const win = windows[p.windowKey === 'tahiyyat' ? 'duha' : p.windowKey]
          const Icon = ICONS[p.windowKey]
          const active = win && isInWindow(now, win.start, win.end)

          return (
            <li
              key={p.id}
              className={`relative px-6 py-4 ${active ? 'bg-emerald-400/[0.04]' : ''}`}
            >
              {active && <span className='absolute left-0 top-0 h-full w-[2px] bg-emerald-400/60' />}
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-1 items-start gap-3'>
                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? 'border-emerald-400/40 bg-emerald-400/[0.08]'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-emerald-300' : 'text-gold-300/80'}`} />
                  </div>
                  <div className='flex-1'>
                    <div className='flex flex-wrap items-baseline gap-x-2'>
                      <span className='font-serif text-base text-ivory-50'>{p.name}</span>
                      <span className='font-arabic text-xs text-gold-300/70' dir='rtl'>
                        {p.arabicName}
                      </span>
                    </div>
                    <p className='mt-0.5 text-[11px] text-ivory-100/55'>
                      {p.rakaat} rak'a{p.rakaat.includes('1') && !p.rakaat.includes('2') ? '' : 'ts'}
                      {' · '}
                      <span className='text-ivory-100/45'>{p.description}</span>
                    </p>
                  </div>
                </div>
                <div className='shrink-0 text-right'>
                  {win ? (
                    <>
                      <p className='font-serif text-sm tabular-nums text-ivory-50/95'>
                        {formatHm(win.start)} → {formatHm(win.end)}
                      </p>
                      {active && (
                        <p className='mt-0.5 text-[9px] uppercase tracking-widest text-emerald-300'>
                          Fenêtre ouverte
                        </p>
                      )}
                    </>
                  ) : (
                    <p className='text-[10px] text-ivory-100/40'>—</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </motion.section>
  )
}
