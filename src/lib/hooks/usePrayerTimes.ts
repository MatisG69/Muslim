'use client'

import { useEffect, useState } from 'react'
import type { DailyTimings, Location, Madhab } from '@/types/prayer'
import { fetchDailyTimings } from '@/lib/api/aladhan'

type Args = {
  location: Location | null
  method: number
  madhab: Madhab
  customFajrAngle?: number
  customIshaAngle?: number
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
}: Args): State => {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null })

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))
    fetchDailyTimings({ location, method, madhab, customFajrAngle, customIshaAngle })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [location?.latitude, location?.longitude, method, madhab, customFajrAngle, customIshaAngle])

  return state
}
