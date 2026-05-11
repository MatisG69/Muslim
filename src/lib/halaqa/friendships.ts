'use client'

import { supabase } from '@/lib/supabase/client'
import { orderedPair } from './pair'
import { getProfilesByIds } from './profiles'
import type { Friendship, FriendshipRow } from './types'

const hydrate = async (
  rows: FriendshipRow[],
  currentUserId: string,
): Promise<Friendship[]> => {
  const friendIds = rows.map(r => (r.user_a === currentUserId ? r.user_b : r.user_a))
  const profiles = await getProfilesByIds(friendIds)
  return rows
    .map(row => {
      const friendId = row.user_a === currentUserId ? row.user_b : row.user_a
      const friend = profiles.get(friendId)
      if (!friend) return null
      const direction: Friendship['direction'] =
        row.status === 'accepted'
          ? 'mutual'
          : row.requested_by === currentUserId
            ? 'outgoing'
            : 'incoming'
      return { ...row, friend, direction }
    })
    .filter((x): x is Friendship => x !== null)
}

export const listFriendships = async (currentUserId: string): Promise<Friendship[]> => {
  const { data, error } = await supabase()
    .from('friendships')
    .select('*')
    .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return hydrate(data ?? [], currentUserId)
}

export const sendFriendRequest = async (
  currentUserId: string,
  targetUserId: string,
): Promise<FriendshipRow> => {
  if (currentUserId === targetUserId) {
    throw new Error('Tu ne peux pas t\'ajouter toi-même')
  }
  const [user_a, user_b] = orderedPair(currentUserId, targetUserId)
  const { data, error } = await supabase()
    .from('friendships')
    .insert({ user_a, user_b, requested_by: currentUserId, status: 'pending' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const acceptFriendRequest = async (friendshipId: string): Promise<FriendshipRow> => {
  const { data, error } = await supabase()
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const declineOrRemoveFriend = async (friendshipId: string): Promise<void> => {
  const { error } = await supabase()
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}

export const blockFriend = async (friendshipId: string): Promise<FriendshipRow> => {
  const { data, error } = await supabase()
    .from('friendships')
    .update({ status: 'blocked' })
    .eq('id', friendshipId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
