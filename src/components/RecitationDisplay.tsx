'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { tokenizeAyahsKeepOriginal } from '@/lib/recitation/diffEngine'
import type { Ayah } from '@/lib/api/quran'

type Props = {
  arabicAyahs: Ayah[]
  cursor: number
  mistakeIndex: number | null
  surahNumber: number
}

export const RecitationDisplay = ({ arabicAyahs, cursor, mistakeIndex, surahNumber }: Props) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cursorRef = useRef<HTMLSpanElement | null>(null)

  const { displayTokens } = tokenizeAyahsKeepOriginal(arabicAyahs, surahNumber)

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [cursor])

  let lastAyah = -1
  const elements: React.ReactNode[] = []

  if (surahNumber !== 1 && surahNumber !== 9) {
    elements.push(
      <p
        key='bismillah'
        className='mb-6 font-arabic text-xl leading-loose text-gold-200/90'
        dir='rtl'
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </p>,
    )
  }

  displayTokens.forEach((tok, i) => {
    if (tok.ayah !== lastAyah) {
      if (lastAyah !== -1) {
        elements.push(
          <span key={`marker-${tok.ayah}`} className='mx-1 inline-flex items-center'>
            <span className='inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/[0.06] text-[10px] text-gold-200'>
              {arabicAyahs[lastAyah - 1]?.numberInSurah ?? lastAyah}
            </span>
          </span>,
        )
      }
      lastAyah = tok.ayah
    }

    const isPast = i < cursor
    const isCurrent = i === cursor
    const isMistake = mistakeIndex !== null && i === mistakeIndex
    const isUpcoming = i > cursor

    const className = isMistake
      ? 'text-rose-300 underline decoration-rose-400 decoration-wavy'
      : isCurrent
        ? 'text-gold-100 bg-gold-400/15 rounded-md px-0.5'
        : isPast
          ? 'text-emerald-300/80'
          : 'text-ivory-100/80'

    elements.push(
      <span
        key={`tok-${i}`}
        ref={isCurrent ? cursorRef : null}
        className={`transition-colors ${className}`}
      >
        {tok.word}{' '}
      </span>,
    )
  })

  if (lastAyah !== -1) {
    elements.push(
      <span key={`marker-end`} className='mx-1 inline-flex items-center'>
        <span className='inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/[0.06] text-[10px] text-gold-200'>
          {lastAyah}
        </span>
      </span>,
    )
  }

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className='card max-h-[55vh] overflow-y-auto px-6 py-7'
    >
      <p
        className='font-arabic text-2xl leading-[2.6] text-ivory-50'
        dir='rtl'
        style={{ wordSpacing: '0.15em' }}
      >
        {elements}
      </p>
    </motion.div>
  )
}
