'use client'

import { useEffect, useRef } from 'react'

type WakeLockSentinel = { release: () => Promise<void> }

export const useWakeLock = (active: boolean) => {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
    }
    if (!nav.wakeLock) return

    let released = false
    const acquire = async () => {
      try {
        sentinelRef.current = await nav.wakeLock!.request('screen')
      } catch {
        // ignored — user may have switched tabs
      }
    }
    acquire()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
