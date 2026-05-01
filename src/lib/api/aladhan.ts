import { isHanafiSchool, type DailyTimings, type Location, type Madhab, type PrayerName, type PrayerTimes } from '@/types/prayer'
import type { PrayerTune } from '@/lib/storage/settings'

const BASE = 'https://api.aladhan.com/v1'

const stripTimezone = (time: string): string => time.split(' ')[0]

const cleanTimings = (raw: Record<string, string>): PrayerTimes => ({
  Fajr: stripTimezone(raw.Fajr),
  Sunrise: stripTimezone(raw.Sunrise),
  Dhuhr: stripTimezone(raw.Dhuhr),
  Asr: stripTimezone(raw.Asr),
  Maghrib: stripTimezone(raw.Maghrib),
  Isha: stripTimezone(raw.Isha),
})

type FetchOptions = {
  location: Location
  date?: Date
  method: number
  madhab: Madhab
  customFajrAngle?: number
  customIshaAngle?: number
  tune?: PrayerTune
}

const buildTuneParam = (tune: PrayerTune): string => {
  // AlAdhan tune order: Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight
  return [0, tune.fajr, tune.sunrise, tune.dhuhr, tune.asr, 0, tune.maghrib, tune.isha, 0].join(',')
}

const hasTune = (tune?: PrayerTune): boolean => {
  if (!tune) return false
  return Object.values(tune).some(v => v !== 0)
}

const buildTimingsUrl = (path: string, opts: FetchOptions): string => {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('latitude', String(opts.location.latitude))
  url.searchParams.set('longitude', String(opts.location.longitude))
  url.searchParams.set('method', String(opts.method))
  url.searchParams.set('school', String(isHanafiSchool(opts.madhab) ? 1 : 0))
  if (opts.method === 99 && opts.customFajrAngle != null && opts.customIshaAngle != null) {
    url.searchParams.set(
      'methodSettings',
      `${opts.customFajrAngle},null,${opts.customIshaAngle}`,
    )
  }
  if (hasTune(opts.tune)) {
    url.searchParams.set('tune', buildTuneParam(opts.tune!))
  }
  return url.toString()
}

export const fetchDailyTimings = async (opts: FetchOptions): Promise<DailyTimings> => {
  const date = opts.date ?? new Date()
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()

  const res = await fetch(buildTimingsUrl(`/timings/${dd}-${mm}-${yyyy}`, opts), { cache: 'no-store' })
  if (!res.ok) throw new Error(`AlAdhan ${res.status}`)
  const json = await res.json()
  if (json.code !== 200) throw new Error(`AlAdhan: ${json.status}`)

  const data = json.data
  return {
    date: data.date.gregorian.date,
    hijriDate: data.date.hijri.date,
    hijriDay: data.date.hijri.day,
    hijriMonth: data.date.hijri.month.en,
    hijriYear: data.date.hijri.year,
    weekday: data.date.hijri.weekday.en,
    gregorianWeekday: data.date.gregorian.weekday.en,
    timings: cleanTimings(data.timings),
    meta: {
      latitude: data.meta.latitude,
      longitude: data.meta.longitude,
      timezone: data.meta.timezone,
      method: { id: data.meta.method.id, name: data.meta.method.name },
    },
  }
}

export const reverseGeocode = async (
  lat: number,
  lon: number,
): Promise<{ city?: string; country?: string }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'Sajda/1.0' } },
    )
    if (!res.ok) return {}
    const json = await res.json()
    return {
      city: json.address?.city || json.address?.town || json.address?.village,
      country: json.address?.country,
    }
  } catch {
    return {}
  }
}

export const buildPrayerDate = (timeStr: string, baseDate = new Date()): Date => {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  return d
}

export const ACTIVE_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export const findNextPrayer = (
  timings: PrayerTimes,
  now = new Date(),
): { name: PrayerName; date: Date; isTomorrow: boolean } => {
  for (const name of ACTIVE_PRAYERS) {
    const date = buildPrayerDate(timings[name], now)
    if (date.getTime() > now.getTime()) return { name, date, isTomorrow: false }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { name: 'Fajr', date: buildPrayerDate(timings.Fajr, tomorrow), isTomorrow: true }
}

export const findCurrentPrayer = (
  timings: PrayerTimes,
  now = new Date(),
): PrayerName | null => {
  let current: PrayerName | null = null
  for (const name of ACTIVE_PRAYERS) {
    const date = buildPrayerDate(timings[name], now)
    if (date.getTime() <= now.getTime()) current = name
    else break
  }
  return current
}
