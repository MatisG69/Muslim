'use client'

import { useEffect } from 'react'
import type { FardWindows } from '@/lib/prayer-windows'
import type { SunnahWindows } from '@/lib/hooks/usePrayerTimes'
import { loadCompletion } from '@/lib/storage/prayer-tracking'

const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
  duha: 'Duha',
  witr: 'Witr',
  tahajjud: 'Tahajjud',
}

const FIRED_KEY_PREFIX = 'sajda.completion.notif.fired.'

const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const wasFired = (key: string): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(FIRED_KEY_PREFIX + key) === '1'
}

const markFired = (key: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(FIRED_KEY_PREFIX + key, '1')
}

const showNotification = (title: string, body: string, tag: string) => {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, icon: '/icon.svg', badge: '/icon.svg' })
  } catch {
    // ignored
  }
}

type Reminder = {
  id: string
  label: string
  fireAt: Date
  windowEnd: Date
  fard: boolean
}

const REMINDER_OFFSET_MIN = 15

const buildReminders = (fard: FardWindows | null, sunnah: SunnahWindows): Reminder[] => {
  const out: Reminder[] = []
  if (fard) {
    for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const) {
      const win = fard[name]
      out.push({
        id: name,
        label: PRAYER_LABELS[name],
        fireAt: new Date(win.end.getTime() - REMINDER_OFFSET_MIN * 60_000),
        windowEnd: win.end,
        fard: true,
      })
    }
  }
  for (const key of ['duha', 'witr', 'tahajjud'] as const) {
    const win = sunnah[key]
    if (!win) continue
    out.push({
      id: key,
      label: PRAYER_LABELS[key],
      fireAt: new Date(win.end.getTime() - REMINDER_OFFSET_MIN * 60_000),
      windowEnd: win.end,
      fard: false,
    })
  }
  return out
}

export const usePrayerCompletionReminders = (
  enabled: boolean,
  fard: FardWindows | null,
  sunnah: SunnahWindows,
) => {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const timeouts: number[] = []
    const reminders = buildReminders(fard, sunnah)
    const now = Date.now()

    for (const r of reminders) {
      const delay = r.fireAt.getTime() - now
      if (delay <= 0 || delay > 2_147_000_000) continue
      const day = ymd(r.windowEnd)
      const key = `${day}-${r.id}`
      if (wasFired(key)) continue

      const id = window.setTimeout(() => {
        if (wasFired(key)) return
        const completion = loadCompletion(r.windowEnd)
        if (completion[r.id]) return
        markFired(key)
        const minutesLeft = Math.max(1, Math.round((r.windowEnd.getTime() - Date.now()) / 60_000))
        const title = r.fard ? `${r.label} bientôt terminé` : `${r.label} bientôt terminé`
        const body = r.fard
          ? `Il reste ~${minutesLeft} min pour accomplir ${r.label}. Marque-la comme accomplie une fois faite.`
          : `Il reste ~${minutesLeft} min pour accomplir la prière surérogatoire ${r.label}.`
        showNotification(title, body, key)
      }, delay)
      timeouts.push(id)
    }

    return () => {
      for (const id of timeouts) clearTimeout(id)
    }
  }, [
    enabled,
    fard?.Fajr.end.getTime(),
    fard?.Dhuhr.end.getTime(),
    fard?.Asr.end.getTime(),
    fard?.Maghrib.end.getTime(),
    fard?.Isha.end.getTime(),
    sunnah.duha?.end.getTime(),
    sunnah.witr?.end.getTime(),
    sunnah.tahajjud?.end.getTime(),
  ])
}
