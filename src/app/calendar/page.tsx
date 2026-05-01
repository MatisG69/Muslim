'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { fetchGregorianMonth, hijriMonthAr, hijriMonthFr, type HijriDay } from '@/lib/api/hijri'

const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const GREGORIAN_MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export default function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [days, setDays] = useState<HijriDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchGregorianMonth(month, year)
      .then(d => {
        if (!cancelled) setDays(d)
      })
      .catch(e => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [month, year])

  const prev = () => {
    if (month === 1) {
      setMonth(12)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }
  const next = () => {
    if (month === 12) {
      setMonth(1)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  const firstDay = useMemo(() => {
    if (!days?.length) return 0
    const d = new Date(year, month - 1, 1).getDay()
    return d === 0 ? 6 : d - 1
  }, [days, month, year])

  const hijriHeader = useMemo(() => {
    if (!days?.length) return ''
    const months = new Set(days.map(d => d.hijri.month))
    const monthsArr = [...months]
    return monthsArr
      .map(m => `${hijriMonthFr(m)} ${days.find(d => d.hijri.month === m)?.hijri.year}`)
      .join(' / ')
  }, [days])

  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div>
          <h1 className='font-serif text-3xl text-ivory-50'>Calendrier</h1>
          <p className='font-arabic text-sm text-gold-300/70' dir='rtl'>التقويم الهجري</p>
        </div>
      </header>

      <section className='card px-5 py-5'>
        <div className='flex items-center justify-between'>
          <button onClick={prev} className='btn-ghost p-2.5' aria-label='Mois précédent'>
            <ChevronLeft className='h-4 w-4' />
          </button>
          <div className='text-center'>
            <p className='font-serif text-xl text-ivory-50'>
              {GREGORIAN_MONTHS_FR[month - 1]} {year}
            </p>
            <p className='mt-0.5 text-xs text-gold-300/70'>{hijriHeader}</p>
          </div>
          <button onClick={next} className='btn-ghost p-2.5' aria-label='Mois suivant'>
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>

        <div className='mt-5 grid grid-cols-7 gap-1 text-center'>
          {WEEKDAYS_FR.map(d => (
            <div key={d} className='py-1 text-[10px] uppercase tracking-widest text-ivory-100/40'>
              {d}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {(days ?? []).map(d => {
            const isFriday = d.hijri.weekday === 'Al Jumu\'ah' || d.hijri.weekday === "Al Jumu'ah"
            return (
              <div
                key={d.gregorian.date}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-center transition-colors ${
                  d.isToday
                    ? 'bg-gold-400/15 ring-1 ring-gold-400/60'
                    : isFriday
                      ? 'bg-emerald-700/15'
                      : 'bg-white/[0.02]'
                }`}
              >
                <span className={`font-serif text-base ${d.isToday ? 'text-gold-100' : 'text-ivory-50'}`}>
                  {d.gregorian.day}
                </span>
                <span className='text-[9px] text-ivory-100/50'>{d.hijri.day}</span>
              </div>
            )
          })}
        </div>

        {loading && <p className='mt-4 text-center text-xs text-ivory-100/40'>Chargement...</p>}
        {error && <p className='mt-4 text-center text-xs text-rose-300'>Erreur: {error}</p>}

        <div className='mt-5 divider-ornate' />

        <div className='mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-ivory-100/50'>
          <span className='flex items-center gap-1.5'>
            <span className='h-2 w-2 rounded-full bg-gold-400' />
            Aujourd&apos;hui
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-2 w-2 rounded-full bg-emerald-700' />
            Vendredi (Jumu&apos;ah)
          </span>
        </div>
      </section>

      {days && days.length > 0 && (
        <section className='card px-5 py-5'>
          <p className='text-xs uppercase tracking-[0.3em] text-gold-300/70'>Mois Hijri</p>
          <div className='mt-3 space-y-2'>
            {[...new Set(days.map(d => d.hijri.month))].map(m => (
              <div key={m} className='flex items-center justify-between'>
                <span className='font-serif text-lg text-ivory-50'>{hijriMonthFr(m)}</span>
                <span className='font-arabic text-lg text-gold-200/80' dir='rtl'>
                  {hijriMonthAr(m)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
