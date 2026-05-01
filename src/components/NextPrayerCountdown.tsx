'use client'

import { motion } from 'framer-motion'
import { useCountdown } from '@/lib/hooks/useCountdown'
import { formatCountdown, formatTime } from '@/lib/utils'
import { PRAYER_LABELS_AR, PRAYER_LABELS_FR, type PrayerName } from '@/types/prayer'
import { PrayerGradient, variantFor } from './PatternBackground'

type Props = {
  name: PrayerName
  time: string
  target: Date
  isTomorrow: boolean
}

export const NextPrayerCountdown = ({ name, time, target, isTomorrow }: Props) => {
  const remaining = useCountdown(target)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className='relative overflow-hidden rounded-3xl border border-gold-400/20 bg-emerald-950/60 px-7 pt-9 pb-8'
    >
      <PrayerGradient variant={variantFor(name)} />
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.07]'
        style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '160px' }}
        aria-hidden
      />

      <div className='relative'>
        <div className='flex items-baseline justify-between'>
          <span className='text-xs uppercase tracking-[0.3em] text-gold-300/80'>
            Prochaine prière
          </span>
          {isTomorrow && (
            <span className='text-[10px] uppercase tracking-widest text-ivory-100/50'>
              Demain
            </span>
          )}
        </div>

        <div className='mt-3 flex items-end justify-between gap-4'>
          <div>
            <h2 className='font-serif text-5xl font-light leading-none text-ivory-50'>
              {PRAYER_LABELS_FR[name]}
            </h2>
            <p className='mt-2 font-arabic text-2xl text-gold-300/90' dir='rtl'>
              {PRAYER_LABELS_AR[name]}
            </p>
          </div>
          <div className='text-right'>
            <p className='font-serif text-3xl text-gold-shimmer'>{formatTime(time)}</p>
          </div>
        </div>

        <div className='mt-6 divider-ornate' />

        <div className='mt-6 text-center'>
          <span className='block text-xs uppercase tracking-[0.4em] text-ivory-100/60'>
            dans
          </span>
          <span className='mt-2 block font-serif text-4xl tracking-wide text-ivory-50'>
            {formatCountdown(remaining)}
          </span>
        </div>
      </div>
    </motion.section>
  )
}
