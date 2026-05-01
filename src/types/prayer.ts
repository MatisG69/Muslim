export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

export const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export const PRAYER_LABELS_FR: Record<PrayerName, string> = {
  Fajr: 'Fajr',
  Sunrise: 'Lever du soleil',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
}

export const PRAYER_LABELS_AR: Record<PrayerName, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
}

export type PrayerTimes = Record<PrayerName, string>

export type DailyTimings = {
  date: string
  hijriDate: string
  hijriDay: string
  hijriMonth: string
  hijriYear: string
  weekday: string
  gregorianWeekday: string
  timings: PrayerTimes
  meta: {
    latitude: number
    longitude: number
    timezone: string
    method: { id: number; name: string }
  }
}

export type CalculationMethod = {
  id: number
  name: string
  region: string
  fajrAngle?: number
  ishaAngle?: number
}

export const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 12, name: 'France — UOIF', region: 'FR', fajrAngle: 18, ishaAngle: 18 },
  { id: 3, name: 'Muslim World League', region: 'World', fajrAngle: 18, ishaAngle: 17 },
  { id: 4, name: 'Umm Al-Qura — La Mecque', region: 'KSA', fajrAngle: 18.5, ishaAngle: 0 },
  { id: 5, name: 'Égypte', region: 'EG', fajrAngle: 19.5, ishaAngle: 17.5 },
  { id: 2, name: 'ISNA — Amérique du Nord', region: 'NA', fajrAngle: 15, ishaAngle: 15 },
  { id: 21, name: 'Maroc', region: 'MA', fajrAngle: 19, ishaAngle: 17 },
  { id: 13, name: 'Diyanet — Turquie', region: 'TR', fajrAngle: 18, ishaAngle: 17 },
  { id: 99, name: 'Personnalisé', region: 'Custom', fajrAngle: 18, ishaAngle: 17 },
]

export type Madhab = 'shafii' | 'maliki' | 'hanbali' | 'hanafi'

export const MADHAB_LABELS: Record<Madhab, { name: string; arabic: string; note: string }> = {
  shafii: { name: 'Shafi’i', arabic: 'الشافعي', note: 'Asr quand l’ombre = objet' },
  maliki: { name: 'Maliki', arabic: 'المالكي', note: 'Asr quand l’ombre = objet' },
  hanbali: { name: 'Hanbali', arabic: 'الحنبلي', note: 'Asr quand l’ombre = objet' },
  hanafi: { name: 'Hanafi', arabic: 'الحنفي', note: 'Asr quand l’ombre = 2 × objet' },
}

export const isHanafiSchool = (m: Madhab): boolean => m === 'hanafi'

export type Location = {
  latitude: number
  longitude: number
  city?: string
  country?: string
}
