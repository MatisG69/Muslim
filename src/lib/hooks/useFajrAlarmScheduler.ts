'use client'

import { useEffect } from 'react'
import { buildPrayerDate } from '@/lib/api/aladhan'
import type { WeekdayFlags } from '@/lib/storage/settings'

const WEEKDAY_KEYS: (keyof WeekdayFlags)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const isDayActive = (date: Date, days: WeekdayFlags): boolean => days[WEEKDAY_KEYS[date.getDay()]]

type Args = {
  enabled: boolean
  fajrTime: string | undefined
  offsetMinutes: number
  days: WeekdayFlags
  onTrigger: () => void
}

export const useFajrAlarmScheduler = ({ enabled, fajrTime, offsetMinutes, days, onTrigger }: Args) => {
  useEffect(() => {
    if (!enabled || !fajrTime) return

    const scheduleNext = (): number => {
      const now = new Date()
      let target = buildPrayerDate(fajrTime, now)
      target = new Date(target.getTime() + offsetMinutes * 60_000)
      if (target.getTime() <= now.getTime() || !isDayActive(target, days)) {
        const candidate = new Date(now)
        for (let i = 1; i <= 7; i++) {
          candidate.setDate(now.getDate() + i)
          if (isDayActive(candidate, days)) {
            target = buildPrayerDate(fajrTime, candidate)
            target = new Date(target.getTime() + offsetMinutes * 60_000)
            break
          }
        }
      }
      const delay = target.getTime() - now.getTime()
      return window.setTimeout(() => {
        onTrigger()
      }, Math.max(0, delay))
    }

    const timeoutId = scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [enabled, fajrTime, offsetMinutes, days.mon, days.tue, days.wed, days.thu, days.fri, days.sat, days.sun])
}

export const buildAlarmKey = (fajrTime: string): string => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}-${fajrTime}`
}

export const wasAlarmTriggered = (key: string): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('sajda.alarm.fired') === key
}

export const markAlarmTriggered = (key: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('sajda.alarm.fired', key)
}
