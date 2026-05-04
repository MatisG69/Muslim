'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DailyTimings, Location, Madhab } from '@/types/prayer'
import { buildPrayerDate, fetchDailyTimings } from '@/lib/api/aladhan'
import type { PrayerTune } from '@/lib/storage/settings'

type Args = {
  location: Location | null
  method: number
  madhab: Madhab
  customFajrAngle?: number
  customIshaAngle?: number
  tune?: PrayerTune
}

export type SunnahWindow = {
  start: Date
  end: Date
}

export type SunnahWindows = {
  duha: SunnahWindow | null
  tahajjud: SunnahWindow | null
  witr: SunnahWindow | null
}

type State = {
  data: DailyTimings | null
  ishaEnd: Date | null
  sunnah: SunnahWindows
  loading: boolean
  error: string | null
}

const computeSunnahWindows = (
  today: DailyTimings,
  tomorrow: DailyTimings,
  base = new Date(),
): { ishaEnd: Date; windows: SunnahWindows } => {
  const sunrise = buildPrayerDate(today.timings.Sunrise, base)
  const dhuhr = buildPrayerDate(today.timings.Dhuhr, base)
  const maghrib = buildPrayerDate(today.timings.Maghrib, base)
  const isha = buildPrayerDate(today.timings.Isha, base)

  const tomorrowDate = new Date(base)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const fajrTomorrow = buildPrayerDate(tomorrow.timings.Fajr, tomorrowDate)

  const nightDuration = fajrTomorrow.getTime() - maghrib.getTime()
  const ishaEnd = new Date(maghrib.getTime() + nightDuration / 2)
  const lastThirdStart = new Date(maghrib.getTime() + (2 * nightDuration) / 3)

  const duhaStart = new Date(sunrise.getTime() + 15 * 60_000)
  const duhaEnd = new Date(dhuhr.getTime() - 10 * 60_000)

  return {
    ishaEnd,
    windows: {
      duha: { start: duhaStart, end: duhaEnd },
      tahajjud: { start: lastThirdStart, end: fajrTomorrow },
      witr: { start: isha, end: fajrTomorrow },
    },
  }
}

const EMPTY_WINDOWS: SunnahWindows = { duha: null, tahajjud: null, witr: null }

export const usePrayerTimes = ({
  location,
  method,
  madhab,
  customFajrAngle,
  customIshaAngle,
  tune,
}: Args): State => {
  const [state, setState] = useState<State>({
    data: null,
    ishaEnd: null,
    sunnah: EMPTY_WINDOWS,
    loading: false,
    error: null,
  })

  const tuneKey = useMemo(
    () =>
      tune
        ? `${tune.fajr},${tune.sunrise},${tune.dhuhr},${tune.asr},${tune.maghrib},${tune.isha}`
        : '',
    [tune?.fajr, tune?.sunrise, tune?.dhuhr, tune?.asr, tune?.maghrib, tune?.isha],
  )

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    Promise.all([
      fetchDailyTimings({ location, date: today, method, madhab, customFajrAngle, customIshaAngle, tune }),
      fetchDailyTimings({ location, date: tomorrow, method, madhab, customFajrAngle, customIshaAngle, tune }),
    ])
      .then(([data, dataTomorrow]) => {
        if (cancelled) return
        const computed = computeSunnahWindows(data, dataTomorrow, today)
        setState({
          data,
          ishaEnd: computed.ishaEnd,
          sunnah: computed.windows,
          loading: false,
          error: null,
        })
      })
      .catch(err => {
        if (!cancelled)
          setState({
            data: null,
            ishaEnd: null,
            sunnah: EMPTY_WINDOWS,
            loading: false,
            error: String(err),
          })
      })
    return () => {
      cancelled = true
    }
  }, [
    location?.latitude,
    location?.longitude,
    method,
    madhab,
    customFajrAngle,
    customIshaAngle,
    tuneKey,
  ])

  return state
}
