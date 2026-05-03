'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ChevronLeft, Droplets } from 'lucide-react'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { WUDU_INVALIDATORS, WUDU_STEPS } from '@/data/wudu'

export default function AblutionsPage() {
  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Ablutions</h1>
        <div className='w-10' />
      </header>

      <section className='card relative overflow-hidden px-6 py-7 text-center'>
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.06]'
          style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
          aria-hidden
        />
        <div className='relative'>
          <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold-300/40 bg-gold-300/[0.06]'>
            <Droplets className='h-5 w-5 text-gold-300' />
          </div>
          <p className='font-arabic text-2xl text-gold-200' dir='rtl'>الوضوء</p>
          <p className='mt-2 text-sm text-ivory-100/70'>« Allah aime ceux qui se purifient » (Coran 9:108)</p>
        </div>
      </section>

      <section className='space-y-3'>
        {WUDU_STEPS.map((step, i) => (
          <motion.article
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className='card px-5 py-5'
          >
            <div className='flex items-start gap-4'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/[0.06]'>
                <span className='font-serif text-sm text-gold-200'>{step.number}</span>
              </div>
              <div className='flex-1'>
                <div className='flex flex-wrap items-baseline gap-x-2'>
                  <h2 className='font-serif text-lg text-ivory-50'>{step.title}</h2>
                  {step.arabic && step.id !== 'dua' && (
                    <span className='font-arabic text-sm text-gold-300/70' dir='rtl'>{step.arabic}</span>
                  )}
                  <span
                    className={`rounded-full border px-2 py-[1px] text-[9px] uppercase tracking-widest ${
                      step.obligation === 'fard'
                        ? 'border-gold-400/50 bg-gold-400/10 text-gold-200'
                        : 'border-white/15 text-ivory-100/60'
                    }`}
                  >
                    {step.obligation === 'fard' ? 'Obligatoire' : 'Sunnah'}
                  </span>
                  {step.repetition && (
                    <span className='text-[10px] uppercase tracking-widest text-ivory-100/50'>
                      ×{step.repetition}
                    </span>
                  )}
                </div>
                <p className='mt-2 text-sm text-ivory-100/85'>{step.description}</p>
                {step.detail && (
                  <p className='mt-2 text-xs italic text-ivory-100/55'>{step.detail}</p>
                )}
                {step.id === 'dua' && step.arabic && (
                  <p className='mt-3 font-arabic text-lg leading-relaxed text-gold-100/90' dir='rtl'>
                    {step.arabic}
                  </p>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      <section className='card px-5 py-5'>
        <header className='mb-3 flex items-center gap-2'>
          <AlertCircle className='h-4 w-4 text-rose-300/80' />
          <h2 className='font-serif text-lg text-ivory-50'>Annule les ablutions</h2>
        </header>
        <ul className='space-y-2 text-sm text-ivory-100/80'>
          {WUDU_INVALIDATORS.map(item => (
            <li key={item} className='flex items-start gap-2'>
              <span className='mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-rose-400/60' />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className='mt-2 pt-4 text-center'>
        <div className='divider-ornate mb-4' />
        <p className='font-arabic text-base text-gold-300/70' dir='rtl'>
          إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ
        </p>
        <p className='mt-1 text-[11px] text-ivory-100/50'>« Quand vous vous levez pour la prière… » (Coran 5:6)</p>
      </footer>
    </PageShell>
  )
}
