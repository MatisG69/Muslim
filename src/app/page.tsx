'use client'

import { motion } from 'framer-motion'
import { BellRing, BookOpen, CalendarCheck, Circle, Compass, Droplets, Lock, MapPin, Mic, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlarmOverlay } from '@/components/AlarmOverlay'
import { JumuahBanner } from '@/components/JumuahBanner'
import { NextPrayerCountdown } from '@/components/NextPrayerCountdown'
import { PageShell } from '@/components/PageShell'
import { PrayerTimesCard } from '@/components/PrayerTimesCard'
import { QiblaCompass } from '@/components/QiblaCompass'
import { SunnahCard } from '@/components/SunnahCard'
import { SunnahPrayersCard } from '@/components/SunnahPrayersCard'
import { findCurrentPrayer, findNextPrayer } from '@/lib/api/aladhan'
import { hijriMonthFr } from '@/lib/api/hijri'
import { useDeviceHeading } from '@/lib/hooks/useDeviceHeading'
import {
  buildAlarmKey,
  markAlarmTriggered,
  useFajrAlarmScheduler,
  wasAlarmTriggered,
} from '@/lib/hooks/useFajrAlarmScheduler'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import {
  useFajrPrayerNotification,
  useWeeklyPlannerNotification,
} from '@/lib/hooks/useLocalNotifications'
import { usePrayerTimes } from '@/lib/hooks/usePrayerTimes'
import { computeQiblaBearing } from '@/lib/qibla'
import { DEFAULT_SETTINGS, loadSettings, type Settings } from '@/lib/storage/settings'
import { formatGregorianDate } from '@/lib/utils'

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [alarmOpen, setAlarmOpen] = useState(false)

  useEffect(() => setSettings(loadSettings()), [])

  const geo = useGeolocation(settings.location)
  const location = settings.location ?? geo.location

  const { data, ishaEnd, sunnah, loading, error } = usePrayerTimes({
    location,
    method: settings.method,
    madhab: settings.madhab,
    customFajrAngle: settings.customFajrAngle,
    customIshaAngle: settings.customIshaAngle,
    tune: settings.tune,
  })

  const next = useMemo(() => (data ? findNextPrayer(data.timings) : null), [data])
  const current = useMemo(() => (data ? findCurrentPrayer(data.timings) : null), [data])

  const heading = useDeviceHeading()
  const qiblaBearing = useMemo(
    () => (location ? computeQiblaBearing(location.latitude, location.longitude) : null),
    [location?.latitude, location?.longitude],
  )

  useFajrAlarmScheduler({
    enabled: settings.fajrAlarmEnabled,
    fajrTime: data?.timings.Fajr,
    offsetMinutes: settings.fajrAlarmOffsetMin,
    days: settings.fajrAlarmDays,
    onTrigger: () => {
      if (!data) return
      const key = buildAlarmKey(data.timings.Fajr)
      if (wasAlarmTriggered(key)) return
      markAlarmTriggered(key)
      setAlarmOpen(true)
    },
  })

  useFajrPrayerNotification(settings.fajrAlarmEnabled, data?.timings.Fajr)
  useWeeklyPlannerNotification(settings.weeklyPlannerNotifEnabled)

  return (
    <PageShell>
      <header className='flex items-start justify-between'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <p className='font-arabic text-2xl text-gold-300/80' dir='rtl'>السلام عليكم</p>
          <p className='mt-1 text-xs uppercase tracking-[0.3em] text-ivory-100/50'>Sajda</p>
        </motion.div>
        {data && (
          <div className='text-right'>
            <p className='font-serif text-base text-ivory-50/95'>
              {data.hijriDay} {hijriMonthFr(data.hijriMonth)}
            </p>
            <p className='font-arabic text-xs text-gold-300/70' dir='rtl'>
              {data.hijriYear} هـ
            </p>
          </div>
        )}
      </header>

      {data && (
        <div className='-mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center'>
          <p className='text-xs uppercase tracking-[0.25em] text-ivory-100/50'>
            {formatGregorianDate(new Date())}
          </p>
          {location && (
            <span className='inline-flex items-center gap-1 text-xs text-ivory-100/60'>
              <MapPin className='h-3 w-3 text-gold-400/80' />
              {location.city ?? `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
            </span>
          )}
        </div>
      )}

      {settings.jumuahReminderEnabled && <JumuahBanner enabled />}

      {loading && !data && <Skeleton />}
      {error && (
        <div className='card px-6 py-5 text-sm text-rose-300/90'>
          Impossible de charger les horaires. {error}
        </div>
      )}
      {!location && geo.status === 'denied' && (
        <div className='card px-6 py-5 text-sm text-ivory-100/80'>
          La localisation est refusée. Activez-la depuis votre navigateur ou
          <Link href='/settings' className='ml-1 text-gold-300 underline'>
            saisissez une ville
          </Link>
          .
        </div>
      )}

      {data && next && (
        <NextPrayerCountdown
          name={next.name}
          time={data.timings[next.name]}
          target={next.date}
          isTomorrow={next.isTomorrow}
        />
      )}

      {data && next && (
        <PrayerTimesCard timings={data.timings} current={current} next={next.name} ishaEnd={ishaEnd} />
      )}

      {data && <SunnahPrayersCard windows={sunnah} />}

      {qiblaBearing != null && (
        <Link
          href='/qibla'
          className='card flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]'
        >
          <div className='shrink-0'>
            <QiblaCompass
              qiblaBearing={qiblaBearing}
              deviceHeading={heading.heading}
              size={88}
              showLabels={false}
            />
          </div>
          <div className='flex-1'>
            <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Direction Qibla</p>
            <p className='mt-1 font-serif text-lg text-ivory-50'>{Math.round(qiblaBearing)}°</p>
            {heading.status !== 'granted' ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void heading.request()
                }}
                className='mt-1 text-[11px] text-gold-300 underline'
              >
                Activer la boussole
              </button>
            ) : (
              <p className='text-[11px] text-ivory-100/50'>Touchez pour la vue complète</p>
            )}
          </div>
          <Compass className='h-5 w-5 shrink-0 text-gold-300' />
        </Link>
      )}

      {settings.sunnahDailyEnabled && <SunnahCard />}

      <section className='grid grid-cols-2 gap-3'>
        <Link href='/quran' className='card group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-white/[0.04]'>
          <BookOpen className='h-5 w-5 text-gold-300' />
          <div>
            <p className='font-serif text-lg text-ivory-50'>Le Coran</p>
            <p className='text-[11px] text-ivory-100/50'>Audio · plage · mode mushaf</p>
          </div>
        </Link>
        <Link href='/tasbih' className='card group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-white/[0.04]'>
          <Circle className='h-5 w-5 text-gold-300' />
          <div>
            <p className='font-serif text-lg text-ivory-50'>Tasbih</p>
            <p className='text-[11px] text-ivory-100/50'>Compteur de dhikr</p>
          </div>
        </Link>
        <Link href='/qibla' className='card group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-white/[0.04]'>
          <Compass className='h-5 w-5 text-gold-300' />
          <div>
            <p className='font-serif text-lg text-ivory-50'>Qibla</p>
            <p className='text-[11px] text-ivory-100/50'>Boussole vers la Mecque</p>
          </div>
        </Link>
        <Link href='/ablutions' className='card group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-white/[0.04]'>
          <Droplets className='h-5 w-5 text-gold-300' />
          <div>
            <p className='font-serif text-lg text-ivory-50'>Ablutions</p>
            <p className='text-[11px] text-ivory-100/50'>Guide étape par étape</p>
          </div>
        </Link>
        <Link href='/planner' className='card group col-span-2 flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/10 ring-1 ring-gold-400/30'>
            <CalendarCheck className='h-4 w-4 text-gold-300' />
          </div>
          <div className='flex-1'>
            <p className='font-serif text-lg text-ivory-50'>Planning de la semaine</p>
            <p className='text-[11px] text-ivory-100/55'>
              Choisis les jours où l'alarme Fajr sonnera
            </p>
          </div>
          <span className='text-gold-300'>→</span>
        </Link>
        <Link
          href='/recitation'
          className='card relative col-span-2 flex items-center gap-4 overflow-hidden px-5 py-5 opacity-70 transition-colors hover:bg-white/[0.03]'
        >
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.04]'
            style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '160px' }}
            aria-hidden
          />
          <div className='relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]'>
            <Mic className='h-5 w-5 text-ivory-100/40' />
            <span className='absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-gold-400/40 bg-ink-900'>
              <Lock className='h-2.5 w-2.5 text-gold-300' />
            </span>
          </div>
          <div className='relative flex-1'>
            <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>À venir</p>
            <p className='font-serif text-lg text-ivory-50/80'>Récitation guidée par IA</p>
            <p className='text-[11px] text-ivory-100/50'>
              Détection automatique de sourate · suivi mot-à-mot
            </p>
          </div>
        </Link>
      </section>

      <section className='card flex items-center justify-between gap-4 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/10 ring-1 ring-gold-400/30'>
            <BellRing className='h-4 w-4 text-gold-300' />
          </div>
          <div>
            <p className='text-sm text-ivory-50'>Alarme Fajr</p>
            <p className='text-xs text-ivory-100/60'>
              {settings.fajrAlarmEnabled ? 'Photo du tapis requise' : 'Désactivée'}
            </p>
          </div>
        </div>
        <button type='button' onClick={() => setAlarmOpen(true)} className='btn-ghost text-xs'>
          <Volume2 className='h-3.5 w-3.5' />
          Tester
        </button>
      </section>

      <footer className='mt-2 pt-4 text-center'>
        <div className='divider-ornate mb-4' />
        <p className='font-arabic text-base text-gold-300/60' dir='rtl'>
          إن الصلاة تنهى عن الفحشاء والمنكر
        </p>
      </footer>

      <AlarmOverlay
        open={alarmOpen}
        adhanSrc='/Adhan.mp3'
        volume={settings.adhanVolume}
        onDismiss={() => setAlarmOpen(false)}
        qiblaOverlay={
          qiblaBearing != null
            ? {
                qiblaBearing,
                deviceHeading: heading.heading,
                onActivate: () => void heading.request(),
              }
            : undefined
        }
      />
    </PageShell>
  )
}

const Skeleton = () => (
  <div className='space-y-4'>
    <div className='h-48 animate-pulse rounded-3xl bg-white/[0.03]' />
    <div className='h-72 animate-pulse rounded-3xl bg-white/[0.03]' />
  </div>
)
