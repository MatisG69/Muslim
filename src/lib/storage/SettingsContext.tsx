'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import {
  DEFAULT_ALARM_DAYS,
  DEFAULT_SETTINGS,
  DEFAULT_TUNE,
  loadSettings as loadLocal,
  saveSettings as saveLocal,
  type Settings,
} from '@/lib/storage/settings'

type SyncStatus = 'idle' | 'loading' | 'saving' | 'error'

type Ctx = {
  settings: Settings
  loaded: boolean
  syncStatus: SyncStatus
  source: 'local' | 'remote'
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<Ctx | null>(null)

const mergeWithDefaults = (raw: unknown): Settings => {
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    tune: { ...DEFAULT_TUNE, ...(partial.tune ?? {}) },
    fajrAlarmDays: { ...DEFAULT_ALARM_DAYS, ...(partial.fajrAlarmDays ?? {}) },
  }
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [source, setSource] = useState<'local' | 'remote'>('local')
  const saveTimerRef = useRef<number | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    const hydrate = async () => {
      setSyncStatus('loading')
      const local = loadLocal()

      if (!user) {
        userIdRef.current = null
        if (!cancelled) {
          setSettings(local)
          setSource('local')
          setLoaded(true)
          setSyncStatus('idle')
        }
        return
      }

      userIdRef.current = user.id
      try {
        const { data, error } = await supabase()
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cancelled) return
        if (error) throw error

        if (data?.settings) {
          setSettings(mergeWithDefaults(data.settings))
        } else {
          // First connection on this account — initialise with current local
          // (per user choice we don't migrate; we just seed defaults).
          const initial = DEFAULT_SETTINGS
          setSettings(initial)
          await supabase()
            .from('user_settings')
            .upsert({ user_id: user.id, settings: initial }, { onConflict: 'user_id' })
        }
        setSource('remote')
        setLoaded(true)
        setSyncStatus('idle')
      } catch (err) {
        console.error('[settings] load error', err)
        if (!cancelled) {
          setSettings(local)
          setSource('local')
          setLoaded(true)
          setSyncStatus('error')
        }
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id])

  const persist = useCallback(
    (next: Settings) => {
      saveLocal(next)
      const userId = userIdRef.current
      if (!userId) return

      if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(async () => {
        setSyncStatus('saving')
        try {
          const { error } = await supabase()
            .from('user_settings')
            .upsert({ user_id: userId, settings: next }, { onConflict: 'user_id' })
          if (error) throw error
          setSyncStatus('idle')
        } catch (err) {
          console.error('[settings] save error', err)
          setSyncStatus('error')
        }
      }, 400)
    },
    [],
  )

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings(prev => {
        const next = mergeWithDefaults({ ...prev, ...patch })
        persist(next)
        return next
      })
    },
    [persist],
  )

  const value = useMemo<Ctx>(
    () => ({ settings, loaded, syncStatus, source, update }),
    [settings, loaded, syncStatus, source, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = (): Ctx => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings doit être dans <SettingsProvider>')
  return ctx
}
