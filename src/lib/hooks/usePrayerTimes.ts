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

type State = {
  data: DailyTimings | null
  ishaEnd: Date | null
  loading: boolean
  error: string | null
}

const computeIshaEnd = (today: DailyTimings, tomorrow: DailyTimings, base = new Date()): Date => {
  const maghrib = buildPrayerDate(today.timings.Maghrib, base)
  const tomorrowDate = new Date(base)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const fajrTomorrow = buildPrayerDate(tomorrow.timings.Fajr, tomorrowDate)
  const midpoint = new Date((maghrib.getTime() + fajrTomorrow.getTime()) / 2)
  return midpoint
}

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
        const ishaEnd = computeIshaEnd(data, dataTomorrow, today)
        setState({ data, ishaEnd, loading: false, error: null })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, ishaEnd: null, loading: false, error: String(err) })
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
