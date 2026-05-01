'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Lock, Mic } from 'lucide-react'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'

export default function RecitationLockedPage() {
  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Récitation</h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className='card relative overflow-hidden px-7 py-12 text-center'
      >
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.06]'
          style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
          aria-hidden
        />
        <div className='relative flex flex-col items-center gap-6'>
          <div className='relative'>
            <div className='absolute -inset-4 rounded-full bg-gold-400/10 blur-2xl' />
            <div className='relative flex h-24 w-24 items-center justify-center rounded-full border border-gold-400/40 bg-gradient-to-b from-gold-300/10 to-emerald-900/40'>
              <Mic className='h-9 w-9 text-gold-300/40' />
              <span className='absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/60 bg-ink-900'>
                <Lock className='h-4 w-4 text-gold-300' />
              </span>
            </div>
          </div>

          <div>
            <p className='text-[10px] uppercase tracking-[0.4em] text-gold-300/80'>
              À venir prochainement
            </p>
            <h2 className='mt-2 font-serif text-3xl text-ivory-50'>Récitation guidée par IA</h2>
            <p className='mt-3 max-w-xs text-sm text-ivory-100/70'>
              Récitez n&apos;importe quelle sourate, l&apos;IA détecte ce que vous lisez,
              suit chaque mot et signale vos erreurs en direct.
            </p>
          </div>

          <div className='divider-ornate w-full' />

          <div className='flex flex-col items-center gap-2'>
            <p className='font-arabic text-lg text-gold-200/90' dir='rtl'>
              قريبا إن شاء الله
            </p>
            <p className='text-[11px] uppercase tracking-widest text-ivory-100/40'>
              In sha&apos; Allah
            </p>
          </div>

          <Link href='/' className='btn-ghost text-xs'>
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.section>
    </PageShell>
  )
}
