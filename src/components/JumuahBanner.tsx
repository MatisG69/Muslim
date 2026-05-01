'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

const isJumuahDay = (now: Date): boolean => now.getDay() === 5

const isThursdayEvening = (now: Date): boolean => {
  return now.getDay() === 4 && now.getHours() >= 18
}

type Mode = 'thursday-eve' | 'jumuah' | null

const computeMode = (now: Date): Mode => {
  if (isJumuahDay(now)) return 'jumuah'
  if (isThursdayEvening(now)) return 'thursday-eve'
  return null
}

export const JumuahBanner = ({ enabled = true }: { enabled?: boolean }) => {
  const [mode, setMode] = useState<Mode>(null)

  useEffect(() => {
    if (!enabled) return
    const check = () => setMode(computeMode(new Date()))
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [enabled])

  if (!enabled || !mode) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='relative overflow-hidden rounded-3xl border border-emerald-600/40 bg-gradient-to-br from-emerald-800/40 via-emerald-900/30 to-ink-900/60 px-5 py-5'
    >
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.07]'
        style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '140px' }}
        aria-hidden
      />
      <div className='relative flex items-start gap-4'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/[0.08]'>
          <Sparkles className='h-5 w-5 text-gold-300' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] uppercase tracking-[0.4em] text-gold-300/80'>
            {mode === 'jumuah' ? 'Vendredi béni' : 'Demain — Jumu’ah'}
          </p>
          <p className='font-arabic text-lg text-gold-200' dir='rtl'>
            يَوْمُ الْجُمُعَةِ
          </p>
          <h3 className='mt-1 font-serif text-xl text-ivory-50'>
            {mode === 'jumuah'
              ? 'La prière du vendredi est une obligation pour tout homme musulman pubère, capable et résident.'
              : 'Préparez-vous pour la prière du vendredi'}
          </h3>
          <ul className='mt-3 space-y-1.5 text-sm text-ivory-100/80'>
            <li className='flex items-start gap-2'>
              <ArrowRight className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300/80' />
              Faire le ghusl, se parfumer, porter ses meilleurs habits
            </li>
            <li className='flex items-start gap-2'>
              <ArrowRight className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300/80' />
              Lire la sourate Al-Kahf
            </li>
            <li className='flex items-start gap-2'>
              <ArrowRight className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300/80' />
              Multiplier les salawat sur le Prophète ﷺ
            </li>
            <li className='flex items-start gap-2'>
              <ArrowRight className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300/80' />
              Arriver tôt à la mosquée
            </li>
          </ul>
        </div>
      </div>
    </motion.section>
  )
}
