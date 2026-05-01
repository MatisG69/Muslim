'use client'

import { useEffect } from 'react'
import { buildPrayerDate } from '@/lib/api/aladhan'
import type { PrayerTimes } from '@/types/prayer'

type Args = {
  enabled: boolean
  fajrTime: string | undefined
  offsetMinutes: number
  onTrigger: () => void
}

export const useFajrAlarmScheduler = ({ enabled, fajrTime, offsetMinutes, onTrigger }: Args) => {
  useEffect(() => {
    if (!enabled || !fajrTime) return

    const scheduleNext = (): number => {
      const now = new Date()
      let target = buildPrayerDate(fajrTime, now)
      target = new Date(target.getTime() + offsetMinutes * 60_000)
      if (target.getTime() <= now.getTime()) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        target = buildPrayerDate(fajrTime, tomorrow)
        target = new Date(target.getTime() + offsetMinutes * 60_000)
      }
      const delay = target.getTime() - now.getTime()
      return window.setTimeout(() => {
        onTrigger()
      }, delay)
    }

    const timeoutId = scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [enabled, fajrTime, offsetMinutes])
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
