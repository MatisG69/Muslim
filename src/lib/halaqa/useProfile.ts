'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { getProfile, updateProfile } from './profiles'
import type { Profile } from './types'

type State = {
  profile: Profile | null
  loading: boolean
  error: string | null
}

export const useProfile = () => {
  const { user } = useAuth()
  const [state, setState] = useState<State>({ profile: null, loading: true, error: null })

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ profile: null, loading: false, error: null })
      return
    }
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const profile = await getProfile(user.id)
      setState({ profile, loading: false, error: null })
    } catch (e) {
      setState({ profile: null, loading: false, error: (e as Error).message })
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const update = useCallback(
    async (patch: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'bio'>>) => {
      if (!user) throw new Error('Non authentifié')
      const next = await updateProfile(user.id, patch)
      setState(s => ({ ...s, profile: next }))
      return next
    },
    [user],
  )

  return { ...state, refresh, update }
}
