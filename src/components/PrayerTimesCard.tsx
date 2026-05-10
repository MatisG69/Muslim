'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatRawatibSummary, rawatibFor, type RawatibPrayer } from '@/data/sunnah-prayers'
import type { FardWindow, FardWindows } from '@/lib/prayer-windows'
import { windowStatus } from '@/lib/prayer-windows'
import { usePrayerCompletion } from '@/lib/storage/prayer-tracking'
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
  windows: FardWindows | null
  next: PrayerName
}

const formatHm = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const emphasisDot = (e: RawatibPrayer['emphasis']): string =>
  e === 'muakkadah' ? 'bg-gold-300' : e === 'sunnah' ? 'bg-emerald-400/70' : 'bg-ivory-100/40'

type FardName = Exclude<PrayerName, 'Sunrise'>

const isFardName = (n: PrayerName): n is FardName => n !== 'Sunrise'

export const PrayerTimesCard = ({ timings, windows, next }: Props) => {
  const { isDone, toggle } = usePrayerCompletion()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

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
          const isFard = isFardName(name)
          const win: FardWindow | null = isFard && windows ? windows[name] : null
          const status = win ? windowStatus(win, now) : null
          const isCurrent = isFard && status === 'active'
          const isNext = name === next && !isCurrent
          const isExpired = status === 'expired'
          const done = isFard ? isDone(name) : false
          const rawatib = isFard ? rawatibFor(name) : []
          const before = rawatib.filter(r => r.position === 'before')
          const after = rawatib.filter(r => r.position === 'after')

          return (
            <li
              key={name}
              className={`relative px-6 py-4 transition-colors ${
                isCurrent ? 'bg-gold-400/[0.06]' : ''
              } ${isNext ? 'bg-gold-400/[0.04]' : ''} ${
                isExpired && !done && isFard ? 'bg-rose-400/[0.025]' : ''
              }`}
            >
              {(isCurrent || isNext) && (
                <span
                  className={`absolute left-0 top-0 h-full w-[2px] ${
                    isCurrent ? 'bg-gold-400' : 'bg-gold-400/40'
                  }`}
                />
              )}
              {done && isFard && (
                <span className='absolute left-0 top-0 h-full w-[2px] bg-emerald-400/70' />
              )}

              {before.length > 0 && (
                <SunnahRow items={before} prayerName={name} variant='before' />
              )}

              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  {isFard && (
                    <button
                      type='button'
                      onClick={() => toggle(name)}
                      aria-label={done ? `Marquer ${name} non accomplie` : `Marquer ${name} accomplie`}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        done
                          ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/15 bg-white/[0.02] text-transparent hover:border-gold-300/50'
                      }`}
                    >
                      <Check className='h-3.5 w-3.5' strokeWidth={3} />
                    </button>
                  )}
                  <div className='flex flex-col'>
                    <span
                      className={`font-serif text-xl ${
                        done
                          ? 'text-emerald-200/95'
                          : isCurrent
                            ? 'text-gold-200'
                            : 'text-ivory-50/90'
                      }`}
                    >
                      {PRAYER_LABELS_FR[name]}
                    </span>
                    <span className='font-arabic text-sm text-ivory-100/40' dir='rtl'>
                      {PRAYER_LABELS_AR[name]}
                    </span>
                    {win && (
                      <span className='mt-1 text-[10px] uppercase tracking-widest text-ivory-100/50'>
                        Jusqu'à {formatHm(win.end)}
                      </span>
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  {isFard && done && (
                    <span className='rounded-full bg-emerald-400/15 px-2 py-[2px] text-[10px] uppercase tracking-widest text-emerald-300'>
                      Accomplie
                    </span>
                  )}
                  {isFard && !done && isCurrent && (
                    <span className='rounded-full bg-gold-400/20 px-2 py-[2px] text-[10px] uppercase tracking-widest text-gold-200'>
                      En cours
                    </span>
                  )}
                  {isFard && !done && isNext && (
                    <span className='rounded-full border border-gold-400/40 px-2 py-[2px] text-[10px] uppercase tracking-widest text-gold-300'>
                      À venir
                    </span>
                  )}
                  {isFard && !done && isExpired && (
                    <span className='rounded-full bg-rose-400/15 px-2 py-[2px] text-[10px] uppercase tracking-widest text-rose-300'>
                      Manquée
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
              </div>

              {after.length > 0 && (
                <SunnahRow items={after} prayerName={name} variant='after' />
              )}

              {isFard && rawatib.length > 0 && (
                <p className='mt-1.5 pl-2 text-[9px] uppercase tracking-widest text-ivory-100/40'>
                  Rawatib · {formatRawatibSummary(rawatib)}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <div className='border-t border-white/[0.04] bg-white/[0.015] px-6 py-3'>
        <div className='flex items-center gap-4 text-[9px] uppercase tracking-widest text-ivory-100/45'>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-1.5 w-1.5 rounded-full bg-gold-300' /> Mu'akkadah
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-400/70' /> Sunnah
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-1.5 w-1.5 rounded-full bg-ivory-100/40' /> Mustahabb
          </span>
        </div>
      </div>
    </motion.section>
  )
}

const SunnahRow = ({
  items,
  prayerName,
  variant,
}: {
  items: RawatibPrayer[]
  prayerName: PrayerName
  variant: 'before' | 'after'
}) => {
  const { isDone, toggle } = usePrayerCompletion()
  return (
    <div className={`flex flex-col gap-1 ${variant === 'before' ? 'mb-2' : 'mt-2'}`}>
      {items.map(r => {
        const done = isDone(r.id)
        return (
          <div
            key={r.id}
            className='flex items-center gap-2 pl-2 text-[11px] text-ivory-100/65'
          >
            <button
              type='button'
              onClick={() => toggle(r.id)}
              aria-label={done ? `Marquer rawatib ${r.id} non accomplie` : `Marquer rawatib ${r.id} accomplie`}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                done
                  ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                  : 'border-white/15 bg-white/[0.02] text-transparent hover:border-gold-300/50'
              }`}
            >
              <Check className='h-2.5 w-2.5' strokeWidth={3} />
            </button>
            <span className={`h-1 w-1 rounded-full ${emphasisDot(r.emphasis)}`} />
            <span className='text-[10px] uppercase tracking-widest text-gold-300/60'>
              {variant === 'before' ? 'Avant' : 'Après'}
            </span>
            <span className={done ? 'text-emerald-200/85' : 'text-ivory-100/85'}>
              {r.rakaat} rak'a{r.rakaat > 1 ? 'ts' : ''} sunnah
            </span>
            {r.note && <span className='hidden sm:inline text-ivory-100/40'>· {r.note}</span>}
          </div>
        )
      })}
    </div>
  )
}
