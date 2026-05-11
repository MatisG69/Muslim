'use client'

import { Search, UserPlus, Check, Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { searchProfiles } from '@/lib/halaqa/profiles'
import type { Friendship, Profile } from '@/lib/halaqa/types'
import { Avatar } from './Avatar'

type Props = {
  friendships: Friendship[]
  onAdd: (userId: string) => Promise<void>
}

export const FriendSearch = ({ friendships, onAdd }: Props) => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const relations = useMemo(() => {
    const map = new Map<string, Friendship>()
    for (const f of friendships) map.set(f.friend.id, f)
    return map
  }, [friendships])

  useEffect(() => {
    const clean = query.trim()
    if (clean.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const id = setTimeout(async () => {
      try {
        const data = await searchProfiles(clean, 15)
        if (!cancelled) setResults(data.filter(p => p.id !== user?.id))
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [query, user])

  const handleAdd = async (uid: string) => {
    setPendingIds(prev => new Set(prev).add(uid))
    try {
      await onAdd(uid)
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setPendingIds(prev => {
        const n = new Set(prev)
        n.delete(uid)
        return n
      })
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <label className='card flex items-center gap-3 px-4 py-2.5'>
        <Search className='h-4 w-4 text-ivory-100/40' />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Chercher par nom ou pseudo…'
          className='flex-1 bg-transparent text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none'
        />
      </label>

      {searching && (
        <p className='text-center text-xs text-ivory-100/40'>Recherche…</p>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className='text-center text-xs text-ivory-100/40'>Aucun résultat</p>
      )}

      {results.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {results.map(p => {
            const rel = relations.get(p.id)
            const isPending = pendingIds.has(p.id)
            return (
              <li
                key={p.id}
                className='card flex items-center justify-between gap-3 px-3 py-2.5'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar profile={p} size='md' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-ivory-50'>{p.display_name}</p>
                    <p className='truncate text-[11px] text-ivory-100/50'>@{p.username}</p>
                  </div>
                </div>
                {rel?.status === 'accepted' ? (
                  <span className='inline-flex items-center gap-1 text-[11px] text-emerald-600'>
                    <Check className='h-3.5 w-3.5' /> Ami
                  </span>
                ) : rel?.status === 'pending' ? (
                  <span className='inline-flex items-center gap-1 text-[11px] text-gold-300/70'>
                    <Clock className='h-3.5 w-3.5' /> En attente
                  </span>
                ) : (
                  <button
                    type='button'
                    disabled={isPending}
                    onClick={() => handleAdd(p.id)}
                    className='btn-ghost gap-1 px-3 py-1.5 text-xs disabled:opacity-40'
                  >
                    <UserPlus className='h-3.5 w-3.5' />
                    Ajouter
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
