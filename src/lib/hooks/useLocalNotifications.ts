'use client'

import { useEffect, useState } from 'react'

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export const useNotificationPermission = () => {
  const [perm, setPerm] = useState<NotifPermission>('default')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      setPerm('unsupported')
      return
    }
    setPerm(Notification.permission as NotifPermission)
  }, [])

  const request = async (): Promise<NotifPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    const next = result as NotifPermission
    setPerm(next)
    return next
  }

  return { perm, request }
}

const showLocalNotification = (title: string, body: string, tag: string) => {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      tag,
      icon: '/icon.svg',
      badge: '/icon.svg',
    })
  } catch {
    // Some browsers (iOS Safari) reject `new Notification` outside service worker
  }
}

const scheduleAt = (target: Date, fn: () => void): number | null => {
  if (typeof window === 'undefined') return null
  const delay = target.getTime() - Date.now()
  if (delay <= 0 || delay > 2_147_000_000) return null
  return window.setTimeout(fn, delay)
}

const FIRED_KEY_PREFIX = 'sajda.notif.fired.'

const wasFired = (key: string): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(FIRED_KEY_PREFIX + key) === '1'
}

const markFired = (key: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(FIRED_KEY_PREFIX + key, '1')
}

const ymdKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const nextSunday17h = (now = new Date()): Date => {
  const target = new Date(now)
  const daysUntilSunday = (7 - now.getDay()) % 7
  target.setDate(now.getDate() + daysUntilSunday)
  target.setHours(17, 0, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7)
  return target
}

export const useWeeklyPlannerNotification = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const schedule = () => {
      const target = nextSunday17h()
      const key = `weekly-${ymdKey(target)}`
      if (wasFired(key)) {
        const next = new Date(target)
        next.setDate(next.getDate() + 7)
        return scheduleAt(next, () => fire(`weekly-${ymdKey(next)}`))
      }
      return scheduleAt(target, () => fire(key))
    }

    const fire = (key: string) => {
      if (wasFired(key)) return
      markFired(key)
      showLocalNotification(
        'Prépare ta semaine',
        'Quels jours veux-tu te lever pour le Fajr ? Ouvre le planning.',
        key,
      )
    }

    const id = schedule()
    return () => {
      if (id != null) clearTimeout(id)
    }
  }, [enabled])
}

export const useFajrPrayerNotification = (
  enabled: boolean,
  fajrTime: string | undefined,
) => {
  useEffect(() => {
    if (!enabled || !fajrTime) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const [h, m] = fajrTime.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)

    const key = `fajr-${ymdKey(target)}`
    if (wasFired(key)) return

    const id = scheduleAt(target, () => {
      if (wasFired(key)) return
      markFired(key)
      showLocalNotification(
        'الله أكبر · Fajr',
        'L\'heure du Fajr est arrivée. La prière est meilleure que le sommeil.',
        key,
      )
    })

    return () => {
      if (id != null) clearTimeout(id)
    }
  }, [enabled, fajrTime])
}
