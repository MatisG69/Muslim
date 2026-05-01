'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, RotateCcw, Vibrate } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { DHIKR_LIST, type Dhikr } from '@/data/dhikr'

const STORAGE_KEY = 'sajda.tasbih.v1'

type State = {
  selectedId: string
  counts: Record<string, number>
  haptic: boolean
}

const DEFAULT_STATE: State = {
  selectedId: DHIKR_LIST[0].id,
  counts: {},
  haptic: true,
}

export default function TasbihPage() {
  const [state, setState] = useState<State>(DEFAULT_STATE)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const selected: Dhikr =
    DHIKR_LIST.find(d => d.id === state.selectedId) ?? DHIKR_LIST[0]
  const count = state.counts[selected.id] ?? 0
  const target = selected.target
  const progress = Math.min(1, count / target)
  const reachedTarget = count > 0 && count % target === 0

  const increment = () => {
    if (state.haptic && 'vibrate' in navigator) navigator.vibrate(15)
    setState(s => ({ ...s, counts: { ...s.counts, [selected.id]: (s.counts[selected.id] ?? 0) + 1 } }))
    if (reachedTarget) {
      // celebration vibration handled by next render
    }
  }

  const reset = () => {
    setState(s => ({ ...s, counts: { ...s.counts, [selected.id]: 0 } }))
  }

  const select = (id: string) => setState(s => ({ ...s, selectedId: id }))

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Tasbih</h1>
        <button
          onClick={() => setState(s => ({ ...s, haptic: !s.haptic }))}
          className={`btn-ghost p-2.5 ${state.haptic ? 'text-gold-300' : ''}`}
          aria-label='Vibrations'
        >
          <Vibrate className='h-4 w-4' />
        </button>
      </header>

      <section className='card flex flex-col items-center px-6 pt-7 pb-6 text-center'>
        <p className='font-arabic text-3xl leading-relaxed text-gold-200' dir='rtl'>
          {selected.arabic}
        </p>
        <p className='mt-2 text-sm italic text-ivory-100/70'>{selected.transliteration}</p>
        <p className='mt-1 text-xs text-ivory-100/50'>{selected.french}</p>
        {selected.source && (
          <p className='mt-1 text-[10px] uppercase tracking-widest text-gold-300/60'>
            {selected.source}
          </p>
        )}
      </section>

      <button
        onClick={increment}
        className='relative mx-auto flex h-72 w-72 items-center justify-center'
        type='button'
      >
        <svg className='absolute inset-0' viewBox='0 0 100 100'>
          <circle cx='50' cy='50' r='46' fill='none' stroke='rgba(255,255,255,0.06)' strokeWidth='2' />
          <motion.circle
            cx='50'
            cy='50'
            r='46'
            fill='none'
            stroke='url(#tasbih-gradient)'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeDasharray={2 * Math.PI * 46}
            initial={false}
            animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - progress) }}
            transform='rotate(-90 50 50)'
            transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          />
          <defs>
            <linearGradient id='tasbih-gradient' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0%' stopColor='#d4a957' />
              <stop offset='100%' stopColor='#f6ecd0' />
            </linearGradient>
          </defs>
        </svg>
        <div className='relative flex flex-col items-center'>
          <motion.span
            key={count}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className='font-serif text-7xl tabular-nums text-ivory-50'
          >
            {count}
          </motion.span>
          <span className='mt-1 text-xs uppercase tracking-[0.3em] text-ivory-100/50'>
            / {target}
          </span>
          {reachedTarget && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='mt-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-0.5 text-[10px] uppercase tracking-widest text-gold-200'
            >
              Tour complet ✦
            </motion.span>
          )}
        </div>
      </button>

      <div className='flex justify-center'>
        <button onClick={reset} className='btn-ghost text-xs'>
          <RotateCcw className='h-3.5 w-3.5' />
          Réinitialiser
        </button>
      </div>

      <section className='card overflow-hidden'>
        <header className='flex items-center justify-between px-5 pt-4 pb-2'>
          <span className='text-xs uppercase tracking-[0.3em] text-gold-300/70'>Choisir un dhikr</span>
        </header>
        <ul className='divide-y divide-white/[0.05]'>
          {DHIKR_LIST.map(d => {
            const c = state.counts[d.id] ?? 0
            const active = d.id === selected.id
            return (
              <li key={d.id}>
                <button
                  onClick={() => select(d.id)}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors ${
                    active ? 'bg-gold-400/[0.06]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className='flex flex-col'>
                    <span className='font-arabic text-lg text-gold-200/90' dir='rtl'>
                      {d.arabic}
                    </span>
                    <span className='text-xs text-ivory-100/60'>{d.transliteration}</span>
                  </div>
                  <div className='text-right'>
                    <span className='font-serif text-xl tabular-nums text-ivory-50'>{c}</span>
                    <span className='ml-1 text-xs text-ivory-100/40'>/ {d.target}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </PageShell>
  )
}
