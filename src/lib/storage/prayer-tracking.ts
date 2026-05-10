'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'

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

const saveCompletionLocal = (data: DailyCompletion, date = new Date()): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(date), JSON.stringify(data))
}

const STORAGE_EVENT = 'sajda:completion-change'

const emitChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

const fetchRemoteCompletion = async (
  userId: string,
  date: Date,
): Promise<DailyCompletion> => {
  const { data, error } = await supabase()
    .from('prayer_completions')
    .select('prayer_id, done')
    .eq('user_id', userId)
    .eq('date', ymd(date))
  if (error) throw error
  const out: DailyCompletion = {}
  for (const row of data ?? []) {
    if (row.done) out[row.prayer_id] = true
  }
  return out
}

const upsertRemoteCompletion = async (
  userId: string,
  date: Date,
  prayerId: string,
  done: boolean,
): Promise<void> => {
  if (done) {
    const { error } = await supabase()
      .from('prayer_completions')
      .upsert(
        { user_id: userId, date: ymd(date), prayer_id: prayerId, done: true },
        { onConflict: 'user_id,date,prayer_id' },
      )
    if (error) throw error
  } else {
    const { error } = await supabase()
      .from('prayer_completions')
      .delete()
      .eq('user_id', userId)
      .eq('date', ymd(date))
      .eq('prayer_id', prayerId)
    if (error) throw error
  }
}

export const usePrayerCompletion = (date = new Date()) => {
  const { user, loading: authLoading } = useAuth()
  const [completion, setCompletion] = useState<DailyCompletion>({})
  const dayKey = ymd(date)
  const dateRef = useRef(date)
  dateRef.current = date

  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    const hydrate = async () => {
      const local = loadCompletion(dateRef.current)
      if (!user) {
        if (!cancelled) setCompletion(local)
        return
      }
      try {
        const remote = await fetchRemoteCompletion(user.id, dateRef.current)
        if (cancelled) return
        setCompletion(remote)
        saveCompletionLocal(remote, dateRef.current)
      } catch (err) {
        console.error('[completion] fetch error', err)
        if (!cancelled) setCompletion(local)
      }
    }

    void hydrate()
    const onChange = () => setCompletion(loadCompletion(dateRef.current))
    window.addEventListener(STORAGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      cancelled = true
      window.removeEventListener(STORAGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [authLoading, user?.id, dayKey])

  const toggle = useCallback(
    (id: string, done?: boolean) => {
      setCompletion(prev => {
        const nextValue = done ?? !prev[id]
        const next = { ...prev, [id]: nextValue }
        saveCompletionLocal(next, dateRef.current)
        emitChange()
        if (user) {
          void upsertRemoteCompletion(user.id, dateRef.current, id, nextValue).catch(err =>
            console.error('[completion] upsert error', err),
          )
        }
        return next
      })
    },
    [user?.id],
  )

  const isDone = useCallback((id: string): boolean => completion[id] === true, [completion])

  return { completion, toggle, isDone }
}
