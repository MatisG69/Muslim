'use client'

import { motion } from 'framer-motion'
import { BellRing, BellOff, ChevronLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { PageShell } from '@/components/PageShell'
import { useNotificationPermission } from '@/lib/hooks/useLocalNotifications'
import { useSettings } from '@/lib/storage/SettingsContext'
import type { WeekdayFlags } from '@/lib/storage/settings'

const DAYS: { key: keyof WeekdayFlags; label: string; arabic: string; weekdayIndex: number }[] = [
  { key: 'mon', label: 'Lundi', arabic: 'الإثنين', weekdayIndex: 1 },
  { key: 'tue', label: 'Mardi', arabic: 'الثلاثاء', weekdayIndex: 2 },
  { key: 'wed', label: 'Mercredi', arabic: 'الأربعاء', weekdayIndex: 3 },
  { key: 'thu', label: 'Jeudi', arabic: 'الخميس', weekdayIndex: 4 },
  { key: 'fri', label: 'Vendredi', arabic: 'الجمعة', weekdayIndex: 5 },
  { key: 'sat', label: 'Samedi', arabic: 'السبت', weekdayIndex: 6 },
  { key: 'sun', label: 'Dimanche', arabic: 'الأحد', weekdayIndex: 0 },
]

export default function PlannerPage() {
  const { settings, update } = useSettings()
  const { perm, request } = useNotificationPermission()

  const toggleDay = (key: keyof WeekdayFlags) => {
    update({ fajrAlarmDays: { ...settings.fajrAlarmDays, [key]: !settings.fajrAlarmDays[key] } })
  }

  const setPreset = (preset: WeekdayFlags) => update({ fajrAlarmDays: preset })

  const enabledCount = useMemo(
    () => Object.values(settings.fajrAlarmDays).filter(Boolean).length,
    [settings.fajrAlarmDays],
  )

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Planning</h1>
        <div className='w-10' />
      </header>

      <section className='card relative overflow-hidden px-6 py-6'>
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.05]'
          style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '160px' }}
          aria-hidden
        />
        <div className='relative'>
          <div className='flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-300/80'>
            <Sparkles className='h-3 w-3' />
            Prépare ta semaine
          </div>
          <h2 className='mt-2 font-serif text-2xl text-ivory-50'>
            Choisis les jours où l'alarme Fajr sonnera
          </h2>
          <p className='mt-2 text-sm text-ivory-100/65'>
            {settings.fajrAlarmEnabled
              ? `${enabledCount} jour${enabledCount > 1 ? 's' : ''} actif${enabledCount > 1 ? 's' : ''}.`
              : 'Active d\'abord l\'alarme dans Réglages.'}
          </p>
        </div>
      </section>

      <section className='space-y-2'>
        {DAYS.map((day, idx) => {
          const active = settings.fajrAlarmDays[day.key]
          const isToday = today.getDay() === day.weekdayIndex
          return (
            <motion.button
              key={day.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              onClick={() => toggleDay(day.key)}
              className={`card flex w-full items-center justify-between px-5 py-4 text-left transition-all ${
                active ? 'ring-1 ring-gold-400/30' : 'opacity-60'
              }`}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`flex h-12 w-12 flex-col items-center justify-center rounded-2xl border ${
                    isToday
                      ? 'border-gold-400/60 bg-gold-400/[0.08]'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <span className='text-[9px] uppercase tracking-widest text-ivory-100/50'>
                    {weekDates[idx].toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className='font-serif text-lg text-ivory-50'>{weekDates[idx].getDate()}</span>
                </div>
                <div>
                  <p className='font-serif text-lg text-ivory-50'>
                    {day.label}
                    {isToday && <span className='ml-2 text-[10px] text-gold-300'>aujourd'hui</span>}
                  </p>
                  <p className='font-arabic text-xs text-gold-300/70' dir='rtl'>
                    {day.arabic}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                {active ? (
                  <BellRing className='h-4 w-4 text-gold-300' />
                ) : (
                  <BellOff className='h-4 w-4 text-ivory-100/40' />
                )}
                <span
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    active ? 'bg-gold-400' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory-50 transition-transform ${
                      active ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </div>
            </motion.button>
          )
        })}
      </section>

      <section className='card px-5 py-5'>
        <h3 className='mb-3 text-xs uppercase tracking-[0.3em] text-gold-300/70'>Préréglages</h3>
        <div className='grid grid-cols-3 gap-2'>
          <PresetButton
            label='Tous les jours'
            onClick={() =>
              setPreset({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true })
            }
          />
          <PresetButton
            label='Semaine'
            onClick={() =>
              setPreset({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false })
            }
          />
          <PresetButton
            label='Aucun'
            onClick={() =>
              setPreset({ mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false })
            }
          />
        </div>
      </section>

      <section className='card flex items-center justify-between gap-3 px-5 py-4'>
        <div>
          <p className='text-sm text-ivory-50'>Notification dimanche 17h</p>
          <p className='text-[11px] text-ivory-100/60'>
            Rappel hebdomadaire pour planifier
          </p>
        </div>
        <button
          type='button'
          onClick={() => update({ weeklyPlannerNotifEnabled: !settings.weeklyPlannerNotifEnabled })}
          className='shrink-0'
          aria-label='Activer notification hebdo'
        >
          <span
            className={`relative inline-block h-6 w-11 rounded-full transition-colors ${
              settings.weeklyPlannerNotifEnabled ? 'bg-gold-400' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory-50 transition-transform ${
                settings.weeklyPlannerNotifEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
      </section>

      {perm !== 'granted' && perm !== 'unsupported' && settings.weeklyPlannerNotifEnabled && (
        <section className='card border-gold-400/40 bg-gold-400/[0.04] px-5 py-4'>
          <p className='text-sm text-ivory-50'>Autoriser les notifications</p>
          <p className='mt-1 text-[11px] text-ivory-100/65'>
            Sans permission, les rappels ne s'afficheront pas.
          </p>
          <button onClick={() => void request()} className='btn-primary mt-3 text-xs'>
            Autoriser
          </button>
          {perm === 'denied' && (
            <p className='mt-2 text-[11px] text-rose-300'>
              Refusé : ouvrez les réglages du navigateur pour réautoriser.
            </p>
          )}
        </section>
      )}

      {perm === 'unsupported' && (
        <p className='text-center text-[11px] text-ivory-100/45'>
          Les notifications ne sont pas supportées sur ce navigateur. Sur iOS, ajoutez l'app à l'écran d'accueil pour activer les notifications.
        </p>
      )}

      <p className='mt-2 text-center text-[11px] text-ivory-100/45'>
        L'alarme Fajr nécessite l'app ouverte. Branchez votre téléphone pour la nuit.
        Les notifications fonctionnent quand l'app est en cours d'exécution.
      </p>
    </PageShell>
  )
}

const PresetButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className='rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs text-ivory-100/85 transition-colors hover:border-gold-400/40 hover:text-ivory-50'
  >
    {label}
  </button>
)
