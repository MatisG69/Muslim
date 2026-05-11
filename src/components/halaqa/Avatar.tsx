'use client'

import { useMemo } from 'react'
import type { Profile } from '@/lib/halaqa/types'

type Props = {
  profile: Pick<Profile, 'display_name' | 'avatar_url' | 'username'> | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-20 w-20 text-base',
}

const seedToColors = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue} 45% 38%) 0%, hsl(${(hue + 35) % 360} 55% 22%) 100%)`
}

export const Avatar = ({ profile, size = 'md', className = '' }: Props) => {
  const initials = useMemo(() => {
    const name = profile?.display_name || profile?.username || '?'
    return name
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('')
  }, [profile])

  const gradient = useMemo(
    () => seedToColors(profile?.username || profile?.display_name || '??'),
    [profile],
  )

  if (profile?.avatar_url) {
    return (
      <span
        className={`relative inline-flex overflow-hidden rounded-full border border-white/10 ${SIZE_CLASS[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar_url}
          alt={profile.display_name}
          className='h-full w-full object-cover'
        />
      </span>
    )
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full font-medium text-ivory-50 ring-1 ring-white/10 ${SIZE_CLASS[size]} ${className}`}
      style={{ background: gradient }}
    >
      {initials || '·'}
    </span>
  )
}
