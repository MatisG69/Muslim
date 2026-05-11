'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import {
  acceptFriendRequest,
  blockFriend,
  declineOrRemoveFriend,
  listFriendships,
  sendFriendRequest,
} from './friendships'
import type { Friendship } from './types'

export const useFriends = () => {
  const { user } = useAuth()
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setFriendships([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await listFriendships(user.id)
      setFriendships(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Subscription Realtime sur les changements d'amitiés concernant l'utilisateur
  useEffect(() => {
    if (!user) return
    const sb = supabase()
    const channel = sb
      .channel(`friendships:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_a=eq.${user.id}` },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_b=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [user, refresh])

  const buckets = useMemo(() => {
    const accepted: Friendship[] = []
    const incoming: Friendship[] = []
    const outgoing: Friendship[] = []
    const blocked: Friendship[] = []
    for (const f of friendships) {
      if (f.status === 'accepted') accepted.push(f)
      else if (f.status === 'blocked') blocked.push(f)
      else if (f.direction === 'incoming') incoming.push(f)
      else outgoing.push(f)
    }
    return { accepted, incoming, outgoing, blocked }
  }, [friendships])

  const sendRequest = useCallback(
    async (targetUserId: string) => {
      if (!user) throw new Error('Non authentifié')
      await sendFriendRequest(user.id, targetUserId)
      await refresh()
    },
    [user, refresh],
  )

  const accept = useCallback(
    async (friendshipId: string) => {
      await acceptFriendRequest(friendshipId)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (friendshipId: string) => {
      await declineOrRemoveFriend(friendshipId)
      await refresh()
    },
    [refresh],
  )

  const block = useCallback(
    async (friendshipId: string) => {
      await blockFriend(friendshipId)
      await refresh()
    },
    [refresh],
  )

  return { friendships, ...buckets, loading, error, refresh, sendRequest, accept, remove, block }
}
