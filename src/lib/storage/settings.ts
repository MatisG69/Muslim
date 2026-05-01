import type { Location, Madhab } from '@/types/prayer'

const KEY = 'sajda.settings.v4'

export type PrayerTune = {
  fajr: number
  sunrise: number
  dhuhr: number
  asr: number
  maghrib: number
  isha: number
}

export type Settings = {
  location: Location | null
  method: number
  madhab: Madhab
  customFajrAngle: number
  customIshaAngle: number
  tune: PrayerTune
  fajrAlarmEnabled: boolean
  fajrAlarmOffsetMin: number
  adhanVolume: number
  jumuahReminderEnabled: boolean
  sunnahDailyEnabled: boolean
}

export const DEFAULT_TUNE: PrayerTune = {
  fajr: 0,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
}

export const DEFAULT_SETTINGS: Settings = {
  location: null,
  method: 2,
  madhab: 'maliki',
  customFajrAngle: 15,
  customIshaAngle: 15,
  tune: DEFAULT_TUNE,
  fajrAlarmEnabled: true,
  fajrAlarmOffsetMin: 0,
  adhanVolume: 1,
  jumuahReminderEnabled: true,
  sunnahDailyEnabled: true,
}

export const loadSettings = (): Settings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      tune: { ...DEFAULT_TUNE, ...(parsed.tune ?? {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (s: Settings) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(s))
}

export const updateSettings = (patch: Partial<Settings>): Settings => {
  const next = { ...loadSettings(), ...patch }
  saveSettings(next)
  return next
}
