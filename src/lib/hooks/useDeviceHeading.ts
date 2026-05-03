'use client'

import { useEffect, useState } from 'react'

type State = {
  heading: number | null
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  error: string | null
}

type DeviceOrientationEventStatic = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export const useDeviceHeading = (): State & { request: () => Promise<void> } => {
  const [state, setState] = useState<State>({ heading: null, status: 'idle', error: null })

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

  const request = async () => {
    if (typeof window === 'undefined') return

    if (!('DeviceOrientationEvent' in window)) {
      setState({ heading: null, status: 'unsupported', error: 'Capteur non disponible' })
      return
    }

    const Doc = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic

    if (typeof Doc.requestPermission === 'function') {
      setState(s => ({ ...s, status: 'requesting' }))
      try {
        const result = await Doc.requestPermission()
        if (result === 'granted') {
          setState({ heading: null, status: 'granted', error: null })
        } else {
          setState({ heading: null, status: 'denied', error: 'Permission refusée' })
        }
      } catch (err) {
        setState({ heading: null, status: 'denied', error: String(err) })
      }
    } else {
      setState({ heading: null, status: 'granted', error: null })
    }
  }

  return { ...state, request }
}
