'use client'

import { ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { fetchSurahsList, type SurahMeta } from '@/lib/api/quran'

export default function QuranPage() {
  const [surahs, setSurahs] = useState<SurahMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchSurahsList()
      .then(setSurahs)
      .catch(e => setError(String(e)))
  }, [])

  const filtered = useMemo(() => {
    if (!surahs) return []
    const q = query.trim().toLowerCase()
    if (!q) return surahs
    return surahs.filter(
      s =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q,
    )
  }, [surahs, query])

  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div>
          <h1 className='font-serif text-3xl text-ivory-50'>Le Coran</h1>
          <p className='font-arabic text-sm text-gold-300/70' dir='rtl'>القرآن الكريم</p>
        </div>
      </header>

      <div className='relative'>
        <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-100/40' />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Rechercher une sourate'
          className='w-full rounded-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:border-gold-400/50 focus:outline-none'
        />
      </div>

      {error && <p className='text-sm text-rose-300'>Erreur de chargement.</p>}
      {!surahs && !error && (
        <div className='space-y-2'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='h-16 animate-pulse rounded-2xl bg-white/[0.03]' />
          ))}
        </div>
      )}

      {surahs && (
        <ul className='card divide-y divide-white/[0.05] overflow-hidden'>
          {filtered.map(s => (
            <li key={s.number}>
              <Link
                href={`/quran/${s.number}`}
                className='flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.03]'
              >
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.06] font-serif text-sm text-gold-200'>
                  {s.number}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='font-serif text-lg text-ivory-50'>{s.englishName}</p>
                  <p className='truncate text-xs text-ivory-100/50'>
                    {s.englishNameTranslation} · {s.numberOfAyahs} versets ·{' '}
                    {s.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
                  </p>
                </div>
                <span className='font-arabic text-2xl text-gold-200/90' dir='rtl'>
                  {s.name.replace('سُورَةُ ', '')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
