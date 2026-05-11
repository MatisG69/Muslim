'use client'

import { supabase } from '@/lib/supabase/client'
import type { Profile } from './types'

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export const searchProfiles = async (query: string, limit = 10): Promise<Profile[]> => {
  const clean = query.trim().toLowerCase()
  if (clean.length < 2) return []
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export const updateProfile = async (
  userId: string,
  patch: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'bio'>>,
): Promise<Profile> => {
  const payload = { ...patch }
  if (payload.username) payload.username = payload.username.toLowerCase()
  const { data, error } = await supabase()
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const getProfilesByIds = async (ids: string[]): Promise<Map<string, Profile>> => {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .in('id', ids)
  if (error) throw error
  const map = new Map<string, Profile>()
  for (const row of data ?? []) map.set(row.id, row)
  return map
}
