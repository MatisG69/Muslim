'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY_PREFIX = 'sajda.prayer.done.'

export type DailyCompletion = Record<string, boolean>

const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const storageKey = (date: Date): string => KEY_PREFIX + ymd(date)

export const loadCompletion = (date = new Date()): DailyCompletion => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey(date))
    if (!raw) return {}
    return JSON.parse(raw) as DailyCompletion
  } catch {
    return {}
  }
}

export const saveCompletion = (data: DailyCompletion, date = new Date()): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(date), JSON.stringify(data))
}

export const setCompleted = (id: string, done: boolean, date = new Date()): DailyCompletion => {
  const current = loadCompletion(date)
  const next = { ...current, [id]: done }
  saveCompletion(next, date)
  return next
}

const STORAGE_EVENT = 'sajda:completion-change'

const emitChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export const usePrayerCompletion = (date = new Date()) => {
  const [completion, setCompletion] = useState<DailyCompletion>({})

  useEffect(() => {
    setCompletion(loadCompletion(date))
    const onChange = () => setCompletion(loadCompletion(date))
    window.addEventListener(STORAGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(STORAGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [ymd(date)])

  const toggle = useCallback(
    (id: string, done?: boolean) => {
      setCompletion(prev => {
        const nextValue = done ?? !prev[id]
        const next = { ...prev, [id]: nextValue }
        saveCompletion(next, date)
        emitChange()
        return next
      })
    },
    [date],
  )

  const isDone = useCallback((id: string): boolean => completion[id] === true, [completion])

  return { completion, toggle, isDone }
}
