'use client'

import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
}

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    configured: isSupabaseConfigured(),
  })

  useEffect(() => {
    if (!state.configured) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    const sb = supabase()
    let mounted = true

    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setState(s => ({
        ...s,
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      }))
    })

    const { data: subscription } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setState(s => ({ ...s, session, user: session?.user ?? null, loading: false }))
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [state.configured])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase().auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase().auth.signUp({ email, password })
    if (error) return { error: error.message, needsConfirmation: false }
    const needsConfirmation = !data.session
    return { error: null, needsConfirmation }
  }, [])

  const signOut = useCallback(async () => {
    await supabase().auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    })
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signUp, signOut, resetPassword }),
    [state, signIn, signUp, signOut, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}
