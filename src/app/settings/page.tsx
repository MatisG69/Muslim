'use client'

import { ChevronLeft, LogIn, LogOut, MapPin, RotateCcw, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { reverseGeocode } from '@/lib/api/aladhan'
import { useAuth } from '@/lib/auth/AuthContext'
import { useSettings } from '@/lib/storage/SettingsContext'
import { DEFAULT_TUNE, type Settings } from '@/lib/storage/settings'
import { CALCULATION_METHODS, MADHAB_LABELS, type Madhab } from '@/types/prayer'

export default function SettingsPage() {
  const { settings: s, update: updateSettings, syncStatus, source } = useSettings()
  const { user, signOut } = useAuth()
  const [cityInput, setCityInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSettings({ [key]: value } as Partial<Settings>)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      const meta = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      update('location', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        ...meta,
      })
    })
  }

  const searchCity = async () => {
    if (!cityInput.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'Sajda/1.0' } },
      )
      const json = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
      if (json.length === 0) {
        setSearchError('Ville introuvable.')
      } else {
        const found = json[0]
        const lat = Number(found.lat)
        const lon = Number(found.lon)
        const meta = await reverseGeocode(lat, lon)
        update('location', { latitude: lat, longitude: lon, ...meta })
        setCityInput('')
      }
    } catch {
      setSearchError('Erreur réseau.')
    } finally {
      setSearching(false)
    }
  }

  const isCustom = s.method === 99

  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-3xl text-ivory-50'>Réglages</h1>
      </header>

      <Section
        title='Compte'
        subtitle={
          user
            ? source === 'remote'
              ? syncStatus === 'saving'
                ? 'Synchronisation…'
                : syncStatus === 'error'
                  ? 'Erreur de synchronisation'
                  : 'Synchronisé'
              : 'Connecté · sync indisponible'
            : 'Crée un compte pour synchroniser tes préférences'
        }
      >
        {user ? (
          <div className='flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3'>
            <div className='flex items-center gap-3 overflow-hidden'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.08]'>
                <User className='h-4 w-4 text-gold-300' />
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm text-ivory-50'>{user.email}</p>
                <p className='text-[10px] uppercase tracking-widest text-ivory-100/45'>
                  Connecté
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => void signOut()}
              className='btn-ghost shrink-0 text-xs'
            >
              <LogOut className='h-3.5 w-3.5' />
              Déconnexion
            </button>
          </div>
        ) : (
          <Link
            href='/login'
            className='flex items-center justify-between gap-3 rounded-2xl border border-gold-400/40 bg-gold-400/[0.06] px-4 py-3 transition-colors hover:bg-gold-400/[0.1]'
          >
            <div>
              <p className='text-sm text-ivory-50'>Se connecter ou créer un compte</p>
              <p className='text-[11px] text-ivory-100/60'>
                Tes préférences seront synchronisées sur tous tes appareils
              </p>
            </div>
            <LogIn className='h-4 w-4 text-gold-300' />
          </Link>
        )}
      </Section>

      <Section title='Localisation' subtitle='Définit le calcul des horaires'>
        <div className='space-y-3'>
          {s.location ? (
            <div className='flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3'>
              <div className='flex items-center gap-3'>
                <MapPin className='h-4 w-4 text-gold-300' />
                <div>
                  <p className='text-sm text-ivory-50'>{s.location.city ?? 'Position'}</p>
                  <p className='text-xs text-ivory-100/50'>
                    {s.location.latitude.toFixed(3)}°, {s.location.longitude.toFixed(3)}°
                  </p>
                </div>
              </div>
              <button onClick={() => update('location', null)} className='text-xs text-rose-300'>
                Effacer
              </button>
            </div>
          ) : (
            <p className='text-sm text-ivory-100/60'>Aucune position définie.</p>
          )}

          <button onClick={detectLocation} className='btn-ghost w-full justify-center'>
            <MapPin className='h-4 w-4' />
            Utiliser ma position
          </button>

          <div className='flex gap-2'>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCity()}
              placeholder='Chercher une ville'
              className='flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:border-gold-400/50 focus:outline-none'
            />
            <button onClick={searchCity} disabled={searching} className='btn-primary px-5 text-sm'>
              {searching ? '...' : 'OK'}
            </button>
          </div>
          {searchError && <p className='text-xs text-rose-300'>{searchError}</p>}
        </div>
      </Section>

      <Section title='Méthode de calcul' subtitle='Convention pour Fajr, Maghrib et Isha'>
        <div className='space-y-2'>
          {CALCULATION_METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => update('method', m.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                s.method === m.id
                  ? 'border-gold-400/60 bg-gold-400/[0.08] text-ivory-50'
                  : 'border-white/10 bg-white/[0.02] text-ivory-100/80 hover:border-white/20'
              }`}
            >
              <div>
                <p>{m.name}</p>
                {m.fajrAngle != null && m.ishaAngle != null && m.id !== 99 && (
                  <p className='mt-0.5 text-[10px] text-ivory-100/40'>
                    Fajr {m.fajrAngle}° · Isha {m.ishaAngle === 0 ? '90 min après Maghrib' : `${m.ishaAngle}°`}
                  </p>
                )}
              </div>
              {s.method === m.id && <span className='text-xs text-gold-300'>✓</span>}
            </button>
          ))}
        </div>
      </Section>

      {isCustom && (
        <Section title='Angles personnalisés' subtitle='Crépuscule astronomique pour Fajr et Isha'>
          <div className='space-y-5'>
            <AngleSlider
              label='Angle Fajr'
              value={s.customFajrAngle}
              min={12}
              max={20}
              step={0.5}
              onChange={v => update('customFajrAngle', v)}
            />
            <AngleSlider
              label='Angle Isha'
              value={s.customIshaAngle}
              min={12}
              max={20}
              step={0.5}
              onChange={v => update('customIshaAngle', v)}
            />
            <p className='text-[11px] text-ivory-100/50'>
              Valeurs courantes : 18° (MWL, UOIF), 17° (Égypte/Maroc Isha), 15° (ISNA), 19,5° (Égypte Fajr).
            </p>
          </div>
        </Section>
      )}

      <Section
        title='Ajustement par prière'
        subtitle='Décalez chaque horaire en minutes pour matcher exactement votre mosquée'
      >
        <div className='space-y-4'>
          <TuneSlider
            label='Fajr'
            value={s.tune.fajr}
            onChange={v => update('tune', { ...s.tune, fajr: v })}
          />
          <TuneSlider
            label='Lever du soleil'
            value={s.tune.sunrise}
            onChange={v => update('tune', { ...s.tune, sunrise: v })}
          />
          <TuneSlider
            label='Dhuhr'
            value={s.tune.dhuhr}
            onChange={v => update('tune', { ...s.tune, dhuhr: v })}
          />
          <TuneSlider
            label='Asr'
            value={s.tune.asr}
            onChange={v => update('tune', { ...s.tune, asr: v })}
          />
          <TuneSlider
            label='Maghrib'
            value={s.tune.maghrib}
            onChange={v => update('tune', { ...s.tune, maghrib: v })}
          />
          <TuneSlider
            label='Isha'
            value={s.tune.isha}
            onChange={v => update('tune', { ...s.tune, isha: v })}
          />
          <button
            onClick={() => update('tune', DEFAULT_TUNE)}
            className='btn-ghost w-full justify-center text-xs'
          >
            <RotateCcw className='h-3.5 w-3.5' />
            Réinitialiser tous les ajustements
          </button>
          <p className='text-[11px] text-ivory-100/50'>
            Conseil : comparez avec les horaires de votre mosquée puis ajustez chaque prière
            de ±1 à ±5 minutes pour aligner exactement.
          </p>
        </div>
      </Section>

      <Section title='École juridique (madhab)' subtitle='Détermine le début de l’Asr'>
        <div className='grid grid-cols-2 gap-2'>
          {(Object.keys(MADHAB_LABELS) as Madhab[]).map(m => {
            const meta = MADHAB_LABELS[m]
            return (
              <button
                key={m}
                onClick={() => update('madhab', m)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  s.madhab === m
                    ? 'border-gold-400/60 bg-gold-400/[0.08] text-ivory-50'
                    : 'border-white/10 bg-white/[0.02] text-ivory-100/80'
                }`}
              >
                <div className='flex items-baseline justify-between'>
                  <span className='font-serif text-base'>{meta.name}</span>
                  <span className='font-arabic text-xs text-gold-300/70'>{meta.arabic}</span>
                </div>
                <p className='mt-1 text-[10px] text-ivory-100/50'>{meta.note}</p>
              </button>
            )
          })}
        </div>
        <p className='mt-3 text-[11px] text-ivory-100/50'>
          Shafi’i, Maliki et Hanbali calculent l’Asr quand l’ombre d’un objet égale sa hauteur.
          Hanafi attend que l’ombre soit deux fois la hauteur.
        </p>
      </Section>

      <Section title='Alarme Fajr' subtitle='Photo du tapis obligatoire pour arrêter'>
        <Toggle
          label='Activer l’alarme Fajr'
          checked={s.fajrAlarmEnabled}
          onChange={v => update('fajrAlarmEnabled', v)}
        />
        <Link
          href='/planner'
          className='mt-3 flex items-center justify-between rounded-2xl bg-white/[0.02] px-4 py-3 text-sm text-ivory-50 transition-colors hover:bg-white/[0.04]'
        >
          <div>
            <p>Jours actifs</p>
            <p className='text-[11px] text-ivory-100/55'>
              {Object.values(s.fajrAlarmDays).filter(Boolean).length}/7 jours · ouvrir le planning
            </p>
          </div>
          <span className='text-gold-300'>→</span>
        </Link>
        <div className='mt-4'>
          <label className='flex items-center justify-between text-sm text-ivory-100/80'>
            <span>Décalage (minutes)</span>
            <span className='font-serif text-lg text-gold-300'>
              {s.fajrAlarmOffsetMin > 0 ? '+' : ''}
              {s.fajrAlarmOffsetMin}
            </span>
          </label>
          <input
            type='range'
            min={-30}
            max={60}
            step={5}
            value={s.fajrAlarmOffsetMin}
            onChange={e => update('fajrAlarmOffsetMin', Number(e.target.value))}
            className='mt-2 w-full accent-gold-400'
          />
        </div>
        <div className='mt-4'>
          <label className='flex items-center justify-between text-sm text-ivory-100/80'>
            <span>Volume Adhan</span>
            <span className='font-serif text-lg text-gold-300'>{Math.round(s.adhanVolume * 100)}%</span>
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.05}
            value={s.adhanVolume}
            onChange={e => update('adhanVolume', Number(e.target.value))}
            className='mt-2 w-full accent-gold-400'
          />
        </div>
      </Section>

      <Section title='Rappels'>
        <div className='space-y-2'>
          <Toggle
            label='Sunnah du jour sur l’accueil'
            checked={s.sunnahDailyEnabled}
            onChange={v => update('sunnahDailyEnabled', v)}
          />
          <Toggle
            label='Rappel Jumu’ah (jeudi soir + vendredi)'
            checked={s.jumuahReminderEnabled}
            onChange={v => update('jumuahReminderEnabled', v)}
          />
        </div>
      </Section>

      <p className='mt-2 text-center text-[11px] text-ivory-100/40'>
        L'alarme nécessite l'app ouverte. Branchez votre téléphone pour la nuit.
      </p>
    </PageShell>
  )
}

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) => (
  <section className='card px-5 py-5'>
    <div className='mb-4'>
      <h2 className='font-serif text-xl text-ivory-50'>{title}</h2>
      {subtitle && <p className='mt-0.5 text-xs text-ivory-100/50'>{subtitle}</p>}
    </div>
    {children}
  </section>
)

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) => (
  <button
    type='button'
    onClick={() => onChange(!checked)}
    className='flex w-full items-center justify-between rounded-2xl bg-white/[0.02] px-4 py-3 text-left'
  >
    <span className='text-sm text-ivory-50'>{label}</span>
    <span
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-gold-400' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory-50 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
)

const AngleSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) => (
  <div>
    <div className='flex items-center justify-between text-sm text-ivory-100/80'>
      <span>{label}</span>
      <span className='font-serif text-lg text-gold-300'>{value.toFixed(1)}°</span>
    </div>
    <input
      type='range'
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className='mt-2 w-full accent-gold-400'
    />
  </div>
)

const TuneSlider = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) => (
  <div>
    <div className='flex items-center justify-between text-sm text-ivory-100/80'>
      <span>{label}</span>
      <span className='font-serif text-lg text-gold-300 tabular-nums'>
        {value > 0 ? '+' : ''}
        {value} min
      </span>
    </div>
    <input
      type='range'
      min={-15}
      max={15}
      step={1}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className='mt-2 w-full accent-gold-400'
    />
  </div>
)
