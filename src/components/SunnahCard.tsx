'use client'

import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDailySunnah, type SunnahReminder } from '@/data/sunnah'

export const SunnahCard = () => {
  const [sunnah, setSunnah] = useState<SunnahReminder | null>(null)

  useEffect(() => {
    setSunnah(getDailySunnah())
  }, [])

  if (!sunnah) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className='card relative overflow-hidden px-5 py-5'
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.06]'>
          <Leaf className='h-4 w-4 text-gold-300' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>
            Sunnah du jour
          </p>
          <h3 className='mt-1 font-serif text-xl text-ivory-50'>{sunnah.title}</h3>
          <p className='mt-1.5 text-sm leading-relaxed text-ivory-100/80'>{sunnah.text}</p>
          <p className='mt-2 text-[10px] uppercase tracking-widest text-ivory-100/40'>
            ✦ {sunnah.source}
          </p>
        </div>
      </div>
    </motion.section>
  )
}
