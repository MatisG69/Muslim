import type { Location, Madhab } from '@/types/prayer'

const KEY = 'sajda.settings.v2'

export type Settings = {
  location: Location | null
  method: number
  madhab: Madhab
  customFajrAngle: number
  customIshaAngle: number
  fajrAlarmEnabled: boolean
  fajrAlarmOffsetMin: number
  adhanVolume: number
  jumuahReminderEnabled: boolean
  sunnahDailyEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  location: null,
  method: 12,
  madhab: 'maliki',
  customFajrAngle: 18,
  customIshaAngle: 17,
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
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
