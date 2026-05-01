'use client'

import { useEffect, useState } from 'react'
import type { Location } from '@/types/prayer'
import { reverseGeocode } from '@/lib/api/aladhan'

type Result = {
  location: Location | null
  status: 'idle' | 'pending' | 'granted' | 'denied' | 'unsupported' | 'error'
  error: string | null
  request: () => void
}

export const useGeolocation = (initial: Location | null): Result => {
  const [location, setLocation] = useState<Location | null>(initial)
  const [status, setStatus] = useState<Result['status']>(initial ? 'granted' : 'idle')
  const [error, setError] = useState<string | null>(null)

  const request = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('pending')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const meta = await reverseGeocode(lat, lon)
        setLocation({ latitude: lat, longitude: lon, ...meta })
        setStatus('granted')
      },
      err => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
        setError(err.message)
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 1000 * 60 * 60 },
    )
  }

  useEffect(() => {
    if (!initial) request()
  }, [])

  return { location, status, error, request }
}
