'use client'

import { motion } from 'framer-motion'
import { formatTime } from '@/lib/utils'
import {
  PRAYER_LABELS_AR,
  PRAYER_LABELS_FR,
  PRAYER_ORDER,
  type PrayerName,
  type PrayerTimes,
} from '@/types/prayer'

type Props = {
  timings: PrayerTimes
  current: PrayerName | null
  next: PrayerName
}

export const PrayerTimesCard = ({ timings, current, next }: Props) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className='card overflow-hidden'
    >
      <header className='flex items-center justify-between px-6 pt-5 pb-3'>
        <span className='text-xs uppercase tracking-[0.3em] text-gold-300/70'>
          Horaires du jour
        </span>
        <span className='font-arabic text-sm text-gold-300/60'>أوقات الصلاة</span>
      </header>

      <ul className='divide-y divide-white/[0.05]'>
        {PRAYER_ORDER.map(name => {
          const isCurrent = name === current
          const isNext = name === next
          return (
            <li
              key={name}
              className={`relative flex items-center justify-between px-6 py-4 transition-colors ${
                isCurrent ? 'bg-gold-400/[0.06]' : ''
              } ${isNext ? 'bg-gold-400/[0.04]' : ''}`}
            >
              {(isCurrent || isNext) && (
                <span
                  className={`absolute left-0 top-0 h-full w-[2px] ${
                    isCurrent ? 'bg-gold-400' : 'bg-gold-400/40'
                  }`}
                />
              )}
              <div className='flex flex-col'>
                <span
                  className={`font-serif text-xl ${
                    isCurrent ? 'text-gold-200' : 'text-ivory-50/90'
                  }`}
                >
                  {PRAYER_LABELS_FR[name]}
                </span>
                <span className='font-arabic text-sm text-ivory-100/40' dir='rtl'>
                  {PRAYER_LABELS_AR[name]}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                {isNext && !isCurrent && (
                  <span className='rounded-full border border-gold-400/40 px-2 py-[2px] text-[10px] uppercase tracking-widest text-gold-300'>
                    À venir
                  </span>
                )}
                {isCurrent && (
                  <span className='rounded-full bg-gold-400/20 px-2 py-[2px] text-[10px] uppercase tracking-widest text-gold-200'>
                    En cours
                  </span>
                )}
                <span
                  className={`font-serif text-2xl tabular-nums ${
                    isCurrent ? 'text-gold-100' : 'text-ivory-50'
                  }`}
                >
                  {formatTime(timings[name])}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </motion.section>
  )
}
