'use client'

import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { fetchSurahDetail, type SurahDetail } from '@/lib/api/quran'

export default function SurahReader() {
  const params = useParams<{ surah: string }>()
  const surahNumber = parseInt(params.surah, 10)
  const [data, setData] = useState<SurahDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFrench, setShowFrench] = useState(true)
  const [showTransliteration, setShowTransliteration] = useState(true)

  useEffect(() => {
    setData(null)
    setError(null)
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      setError('Sourate invalide')
      return
    }
    fetchSurahDetail(surahNumber)
      .then(setData)
      .catch(e => setError(String(e)))
  }, [surahNumber])

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/quran' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div className='flex gap-2'>
          <button
            onClick={() => setShowTransliteration(v => !v)}
            className={`btn-ghost p-2.5 ${showTransliteration ? 'text-gold-300' : ''}`}
            aria-label='Translittération'
            title='Translittération'
          >
            <span className='text-[10px] font-bold'>Tr</span>
          </button>
          <button
            onClick={() => setShowFrench(v => !v)}
            className={`btn-ghost p-2.5 ${showFrench ? 'text-gold-300' : ''}`}
            aria-label='Traduction'
            title='Traduction française'
          >
            {showFrench ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          </button>
        </div>
      </header>

      {error && <p className='text-sm text-rose-300'>{error}</p>}
      {!data && !error && (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='h-24 animate-pulse rounded-2xl bg-white/[0.03]' />
          ))}
        </div>
      )}

      {data && (
        <>
          <section className='card relative overflow-hidden px-6 py-7 text-center'>
            <div
              className='pointer-events-none absolute inset-0 opacity-[0.06]'
              style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
              aria-hidden
            />
            <div className='relative'>
              <p className='text-[10px] uppercase tracking-[0.4em] text-gold-300/70'>
                Sourate {data.meta.number}
              </p>
              <h1 className='mt-2 font-serif text-3xl text-ivory-50'>{data.meta.englishName}</h1>
              <p className='mt-1 text-xs text-ivory-100/60'>
                {data.meta.englishNameTranslation} · {data.meta.numberOfAyahs} versets
              </p>
              <p className='mt-4 font-arabic text-3xl text-gold-200' dir='rtl'>
                {data.meta.name}
              </p>
              {data.meta.number !== 9 && (
                <p className='mt-5 font-arabic text-xl leading-loose text-gold-100/90' dir='rtl'>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              )}
            </div>
          </section>

          <section className='space-y-4'>
            {data.arabic.map((ayah, i) => {
              const fr = data.french[i]
              const tr = data.transliteration[i]
              const isBismillahPrefixed =
                data.meta.number !== 1 &&
                data.meta.number !== 9 &&
                i === 0 &&
                ayah.text.startsWith('بِسْمِ')
              const arabicText = isBismillahPrefixed
                ? ayah.text.replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '')
                : ayah.text

              return (
                <article
                  key={ayah.number}
                  className='card px-5 py-5'
                >
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='flex h-7 w-7 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.06] text-[11px] text-gold-200'>
                      {ayah.numberInSurah}
                    </span>
                    <span className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/40'>
                      Juz {ayah.juz} · Page {ayah.page}
                    </span>
                  </div>
                  <p
                    className='font-arabic text-2xl leading-[2.4] text-ivory-50'
                    dir='rtl'
                    style={{ wordSpacing: '0.1em' }}
                  >
                    {arabicText}
                  </p>
                  {showTransliteration && tr && (
                    <p className='mt-3 text-sm italic text-ivory-100/60'>{tr.text}</p>
                  )}
                  {showFrench && fr && (
                    <p className='mt-3 text-sm leading-relaxed text-ivory-100/85'>{fr.text}</p>
                  )}
                </article>
              )
            })}
          </section>

          <nav className='flex items-center justify-between gap-3 pt-2'>
            {surahNumber > 1 ? (
              <Link href={`/quran/${surahNumber - 1}`} className='btn-ghost'>
                <ChevronLeft className='h-4 w-4' />
                Précédente
              </Link>
            ) : (
              <span />
            )}
            {surahNumber < 114 ? (
              <Link href={`/quran/${surahNumber + 1}`} className='btn-primary'>
                Suivante
                <ChevronRight className='h-4 w-4' />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}
    </PageShell>
  )
}
