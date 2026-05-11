'use client'

import { BookOpen, ChevronLeft, MessageCircle, Mic2, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { Avatar } from '@/components/halaqa/Avatar'
import { useAuth } from '@/lib/auth/AuthContext'
import { useFriends } from '@/lib/halaqa/useFriends'
import { useRooms } from '@/lib/halaqa/useRooms'
import type { RoomKind } from '@/lib/halaqa/types'

const KINDS: { value: RoomKind; label: string; icon: typeof Mic2; desc: string }[] = [
  { value: 'recitation', label: 'Récitation', icon: Mic2, desc: 'Réciter ensemble en direct' },
  { value: 'reminder', label: 'Rappel', icon: Sparkles, desc: 'Partager un rappel court' },
  { value: 'story', label: 'Histoire', icon: BookOpen, desc: 'Raconter une histoire islamique' },
  { value: 'mixed', label: 'Halaqa', icon: MessageCircle, desc: 'Discussion libre' },
]

export default function NewRoomPage() {
  const router = useRouter()
  const { user, loading: authLoading, configured } = useAuth()
  const { accepted } = useFriends()
  const { create } = useRooms()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<RoomKind>('recitation')
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && configured && !user) router.replace('/login')
  }, [authLoading, configured, user, router])

  const isGroup = useMemo(() => selectedFriends.size > 1, [selectedFriends])

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Donne un titre à ta halaqa')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const room = await create({
        title,
        description,
        kind,
        is_group: isGroup,
        invite_user_ids: Array.from(selectedFriends),
      })
      router.replace(`/halaqa/rooms/${room.id}`)
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/halaqa' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Nouvelle halaqa</h1>
      </header>

      <form onSubmit={submit} className='flex flex-col gap-5'>
        <div className='card flex flex-col gap-3 px-4 py-4'>
          <label className='flex flex-col gap-1.5'>
            <span className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Titre</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='Sourate Al-Mulk avec Younes…'
              maxLength={80}
              required
              className='bg-transparent text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none'
            />
          </label>
          <label className='flex flex-col gap-1.5'>
            <span className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/40'>
              Description (optionnel)
            </span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={240}
              className='resize-none bg-transparent text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none'
              placeholder='Ce soir après Maghrib, on récite ensemble.'
            />
          </label>
        </div>

        <div className='flex flex-col gap-2'>
          <h2 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/50'>Type</h2>
          <div className='grid grid-cols-2 gap-2'>
            {KINDS.map(({ value, label, icon: Icon, desc }) => {
              const active = value === kind
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setKind(value)}
                  className={`flex flex-col gap-1.5 rounded-2xl px-3 py-3 text-left transition-colors ${
                    active
                      ? 'bg-gradient-to-b from-gold-400/15 to-emerald-900/30 ring-1 ring-gold-400/40'
                      : 'bg-white/[0.03] ring-1 ring-white/[0.06]'
                  }`}
                >
                  <span className='flex items-center gap-2 text-sm font-medium text-ivory-50'>
                    <Icon className='h-4 w-4 text-gold-200' /> {label}
                  </span>
                  <span className='text-[11px] text-ivory-100/50'>{desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/50'>
              Inviter ({selectedFriends.size})
            </h2>
            <span className='inline-flex items-center gap-1 text-[11px] text-ivory-100/40'>
              <Users className='h-3 w-3' />
              {isGroup ? 'Groupe' : selectedFriends.size === 1 ? '1v1' : 'Solo'}
            </span>
          </div>
          {accepted.length === 0 ? (
            <div className='card px-4 py-5 text-center'>
              <p className='text-xs text-ivory-100/60'>
                Aucun ami pour l&apos;instant.{' '}
                <Link href='/halaqa/friends' className='text-gold-200 underline'>
                  Ajouter des amis
                </Link>
              </p>
            </div>
          ) : (
            <ul className='flex flex-col gap-2'>
              {accepted.map(f => {
                const sel = selectedFriends.has(f.friend.id)
                return (
                  <li key={f.id}>
                    <button
                      type='button'
                      onClick={() => toggleFriend(f.friend.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                        sel
                          ? 'bg-gradient-to-b from-gold-400/15 to-emerald-900/30 ring-1 ring-gold-400/40'
                          : 'bg-white/[0.03] ring-1 ring-white/[0.06]'
                      }`}
                    >
                      <span className='flex min-w-0 items-center gap-3'>
                        <Avatar profile={f.friend} size='md' />
                        <span className='min-w-0 text-left'>
                          <span className='block truncate text-sm font-medium text-ivory-50'>
                            {f.friend.display_name}
                          </span>
                          <span className='block truncate text-[11px] text-ivory-100/50'>
                            @{f.friend.username}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${
                          sel
                            ? 'bg-gold-300 text-ink-900 ring-gold-300'
                            : 'bg-transparent ring-white/20'
                        }`}
                      >
                        {sel && <span className='block h-2 w-2 rounded-full bg-ink-900' />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && <p className='text-center text-xs text-rose-300'>{error}</p>}

        <button type='submit' disabled={submitting} className='btn-primary w-full disabled:opacity-40'>
          {submitting ? 'Création…' : 'Créer la halaqa'}
        </button>
      </form>
    </PageShell>
  )
}
