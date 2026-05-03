import type { Location, Madhab } from '@/types/prayer'

const KEY = 'sajda.settings.v5'

export type PrayerTune = {
  fajr: number
  sunrise: number
  dhuhr: number
  asr: number
  maghrib: number
  isha: number
}

export type WeekdayFlags = {
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
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
  fajrAlarmDays: WeekdayFlags
  adhanVolume: number
  jumuahReminderEnabled: boolean
  sunnahDailyEnabled: boolean
  preferredReciterId: string
  mushafMode: boolean
  weeklyPlannerNotifEnabled: boolean
}

export const DEFAULT_TUNE: PrayerTune = {
  fajr: 0,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
}

export const DEFAULT_ALARM_DAYS: WeekdayFlags = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
  sun: true,
}

export const DEFAULT_SETTINGS: Settings = {
  location: null,
  method: 3,
  madhab: 'maliki',
  customFajrAngle: 15,
  customIshaAngle: 15,
  tune: DEFAULT_TUNE,
  fajrAlarmEnabled: true,
  fajrAlarmOffsetMin: 0,
  fajrAlarmDays: DEFAULT_ALARM_DAYS,
  adhanVolume: 1,
  jumuahReminderEnabled: true,
  sunnahDailyEnabled: true,
  preferredReciterId: 'ar.alafasy',
  mushafMode: false,
  weeklyPlannerNotifEnabled: true,
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
      fajrAlarmDays: { ...DEFAULT_ALARM_DAYS, ...(parsed.fajrAlarmDays ?? {}) },
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
