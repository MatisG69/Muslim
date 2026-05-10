import { buildPrayerDate } from '@/lib/api/aladhan'
import type { DailyTimings, PrayerName, PrayerTimes } from '@/types/prayer'

export type FardWindow = {
  start: Date
  end: Date
}

export type FardWindows = Record<Exclude<PrayerName, 'Sunrise'>, FardWindow>

export type WindowStatus = 'upcoming' | 'active' | 'expired'

export const computeFardWindows = (
  today: DailyTimings,
  tomorrow: DailyTimings,
  base = new Date(),
): FardWindows => {
  const t = today.timings
  const fajr = buildPrayerDate(t.Fajr, base)
  const sunrise = buildPrayerDate(t.Sunrise, base)
  const dhuhr = buildPrayerDate(t.Dhuhr, base)
  const asr = buildPrayerDate(t.Asr, base)
  const maghrib = buildPrayerDate(t.Maghrib, base)
  const isha = buildPrayerDate(t.Isha, base)

  const tomorrowDate = new Date(base)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const fajrTomorrow = buildPrayerDate(tomorrow.timings.Fajr, tomorrowDate)

  const nightDuration = fajrTomorrow.getTime() - maghrib.getTime()
  const ishaEnd = new Date(maghrib.getTime() + nightDuration / 2)

  return {
    Fajr: { start: fajr, end: sunrise },
    Dhuhr: { start: dhuhr, end: asr },
    Asr: { start: asr, end: maghrib },
    Maghrib: { start: maghrib, end: isha },
    Isha: { start: isha, end: ishaEnd },
  }
}

export const windowStatus = (win: FardWindow, now = new Date()): WindowStatus => {
  const t = now.getTime()
  if (t < win.start.getTime()) return 'upcoming'
  if (t >= win.end.getTime()) return 'expired'
  return 'active'
}

export const findCurrentFardPrayer = (
  windows: FardWindows,
  now = new Date(),
): Exclude<PrayerName, 'Sunrise'> | null => {
  const order: Exclude<PrayerName, 'Sunrise'>[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
  for (const name of order) {
    if (windowStatus(windows[name], now) === 'active') return name
  }
  return null
}

export const findNextFardPrayer = (
  windows: FardWindows,
  timings: PrayerTimes,
  now = new Date(),
): { name: Exclude<PrayerName, 'Sunrise'>; date: Date; isTomorrow: boolean } => {
  const order: Exclude<PrayerName, 'Sunrise'>[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
  for (const name of order) {
    if (windows[name].start.getTime() > now.getTime()) {
      return { name, date: windows[name].start, isTomorrow: false }
    }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { name: 'Fajr', date: buildPrayerDate(timings.Fajr, tomorrow), isTomorrow: true }
}
