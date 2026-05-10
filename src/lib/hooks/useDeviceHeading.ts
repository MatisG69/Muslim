'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type State = {
  heading: number | null
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  error: string | null
}

type DeviceOrientationEventStatic = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const PERSIST_KEY = 'sajda.compass.authorized'

const wasAuthorized = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(PERSIST_KEY) === '1'
  } catch {
    return false
  }
}

const persistAuthorized = (value: boolean) => {
  if (typeof window === 'undefined') return
  try {
    if (value) localStorage.setItem(PERSIST_KEY, '1')
    else localStorage.removeItem(PERSIST_KEY)
  } catch {
    // ignored
  }
}

export const useDeviceHeading = (): State & { request: () => Promise<void> } => {
  const [state, setState] = useState<State>({ heading: null, status: 'idle', error: null })
  const autoTriedRef = useRef(false)

  useEffect(() => {
    if (state.status !== 'granted') return

    const handler = (event: DeviceOrientationEvent) => {
      const e = event as DeviceOrientationEvent & { webkitCompassHeading?: number }
      let heading: number | null = null

      if (typeof e.webkitCompassHeading === 'number') {
        heading = e.webkitCompassHeading
      } else if (typeof e.alpha === 'number') {
        heading = (360 - e.alpha) % 360
      }

      if (heading != null) setState(s => ({ ...s, heading }))
    }

    window.addEventListener('deviceorientation', handler, true)
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [state.status])

  const grant = useCallback(async (silent: boolean) => {
    if (typeof window === 'undefined') return

    if (!('DeviceOrientationEvent' in window)) {
      setState({ heading: null, status: 'unsupported', error: 'Capteur non disponible' })
      return
    }

    const Doc = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic

    if (typeof Doc.requestPermission === 'function') {
      if (!silent) setState(s => ({ ...s, status: 'requesting' }))
      try {
        const result = await Doc.requestPermission()
        if (result === 'granted') {
          persistAuthorized(true)
          setState({ heading: null, status: 'granted', error: null })
        } else if (!silent) {
          persistAuthorized(false)
          setState({ heading: null, status: 'denied', error: 'Permission refusée' })
        }
      } catch (err) {
        if (!silent) {
          persistAuthorized(false)
          setState({ heading: null, status: 'denied', error: String(err) })
        }
      }
    } else {
      persistAuthorized(true)
      setState({ heading: null, status: 'granted', error: null })
    }
  }, [])

  useEffect(() => {
    if (autoTriedRef.current) return
    if (typeof window === 'undefined') return
    if (!('DeviceOrientationEvent' in window)) return
    if (!wasAuthorized()) return
    autoTriedRef.current = true
    void grant(true)
  }, [grant])

  const request = useCallback(() => grant(false), [grant])

  return { ...state, request }
}
