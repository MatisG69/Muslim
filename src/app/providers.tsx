'use client'

import type { ReactNode } from 'react'
import { SplashGreeting } from '@/components/SplashGreeting'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { SettingsProvider } from '@/lib/storage/SettingsContext'

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <SettingsProvider>
      {children}
      <SplashGreeting />
    </SettingsProvider>
  </AuthProvider>
)
