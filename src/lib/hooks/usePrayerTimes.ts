'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DailyTimings, Location, Madhab } from '@/types/prayer'
import { fetchDailyTimings } from '@/lib/api/aladhan'
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
  loading: boolean
  error: string | null
}

export const usePrayerTimes = ({
  location,
  method,
  madhab,
  customFajrAngle,
  customIshaAngle,
  tune,
}: Args): State => {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null })

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
    fetchDailyTimings({ location, method, madhab, customFajrAngle, customIshaAngle, tune })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: String(err) })
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
