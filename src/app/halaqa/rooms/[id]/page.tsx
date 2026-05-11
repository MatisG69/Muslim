'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Trash2, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { Avatar } from '@/components/halaqa/Avatar'
import { LiveSessionPanel } from '@/components/halaqa/LiveSessionPanel'
import { MessageComposer } from '@/components/halaqa/MessageComposer'
import { MessageList } from '@/components/halaqa/MessageList'
import { useAuth } from '@/lib/auth/AuthContext'
import { useFriends } from '@/lib/halaqa/useFriends'
import { useRoom } from '@/lib/halaqa/useRooms'
import { useRoomMessages } from '@/lib/halaqa/useRoomMessages'
import { deleteRoom, inviteToRoom, leaveRoom } from '@/lib/halaqa/rooms'

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const roomId = params.id

  const { user, loading: authLoading, configured } = useAuth()
  const { room, loading: roomLoading, refresh } = useRoom(roomId)
  const { messages, sendText, sendAudio } = useRoomMessages(roomId)
  const { accepted } = useFriends()

  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && configured && !user) router.replace('/login')
  }, [authLoading, configured, user, router])

  const memberIds = useMemo(
    () => new Set(room?.members.map(m => m.user_id) ?? []),
    [room],
  )

  const invitable = useMemo(
    () => accepted.filter(f => !memberIds.has(f.friend.id)),
    [accepted, memberIds],
  )

  if (authLoading || roomLoading) {
    return (
      <PageShell>
        <p className='py-10 text-center text-xs text-ivory-100/40'>Chargement…</p>
      </PageShell>
    )
  }

  if (!room) {
    return (
      <PageShell>
        <header className='flex items-center gap-3'>
          <Link href='/halaqa' className='btn-ghost p-2.5' aria-label='Retour'>
            <ChevronLeft className='h-4 w-4' />
          </Link>
        </header>
        <p className='card px-6 py-8 text-center text-sm text-ivory-100/70'>
          Cette halaqa est introuvable ou tu n&apos;y as pas accès.
        </p>
      </PageShell>
    )
  }

  const isOwner = user?.id === room.owner_id

  const handleInvite = async (uid: string) => {
    setInviting(prev => new Set(prev).add(uid))
    try {
      await inviteToRoom(room.id, [uid])
      await refresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setInviting(prev => {
        const n = new Set(prev)
        n.delete(uid)
        return n
      })
    }
  }

  const handleLeave = async () => {
    if (!user) return
    if (!confirm('Quitter cette halaqa ?')) return
    try {
      await leaveRoom(room.id, user.id)
      router.replace('/halaqa')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cette halaqa ?')) return
    try {
      await deleteRoom(room.id)
      router.replace('/halaqa')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <PageShell>
      <header className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <Link href='/halaqa' className='btn-ghost p-2.5' aria-label='Retour'>
            <ChevronLeft className='h-4 w-4' />
          </Link>
          <div className='min-w-0'>
            <h1 className='truncate font-serif text-2xl text-ivory-50'>{room.title}</h1>
            <p className='truncate text-[11px] text-ivory-100/50'>
              {room.is_group ? 'Groupe' : '1v1'} · {room.members.length} membre
              {room.members.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          type='button'
          onClick={isOwner ? handleDelete : handleLeave}
          className='btn-ghost p-2.5 text-rose-300'
          aria-label={isOwner ? 'Supprimer' : 'Quitter'}
        >
          <Trash2 className='h-4 w-4' />
        </button>
      </header>

      <LiveSessionPanel room={room} />

      <section className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/50'>
            <Users className='inline h-3 w-3' /> Membres
          </h2>
          {isOwner && invitable.length > 0 && (
            <button
              type='button'
              onClick={() => setShowInvite(s => !s)}
              className='btn-ghost gap-1.5 text-xs'
            >
              <UserPlus className='h-3.5 w-3.5' />
              Inviter
            </button>
          )}
        </div>
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {room.members.map(m => (
            <div
              key={m.user_id}
              className='flex flex-none flex-col items-center gap-1 rounded-2xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5'
            >
              <Avatar profile={m.profile} size='md' />
              <span className='max-w-[5rem] truncate text-[11px] text-ivory-50'>
                {m.profile?.display_name ?? '—'}
              </span>
              {m.role === 'host' && (
                <span className='text-[9px] uppercase tracking-widest text-gold-300/70'>Hôte</span>
              )}
            </div>
          ))}
        </div>

        {showInvite && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className='mt-2 flex flex-col gap-2 overflow-hidden'
          >
            {invitable.map(f => (
              <li
                key={f.id}
                className='card flex items-center justify-between gap-3 px-3 py-2.5'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar profile={f.friend} size='md' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm text-ivory-50'>{f.friend.display_name}</p>
                    <p className='truncate text-[11px] text-ivory-100/50'>@{f.friend.username}</p>
                  </div>
                </div>
                <button
                  type='button'
                  disabled={inviting.has(f.friend.id)}
                  onClick={() => handleInvite(f.friend.id)}
                  className='btn-ghost gap-1 px-3 py-1.5 text-xs disabled:opacity-40'
                >
                  <UserPlus className='h-3.5 w-3.5' />
                  Inviter
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </section>

      <section className='flex min-h-[300px] flex-col gap-3'>
        <h2 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/50'>Messages</h2>
        <div className='flex max-h-[50vh] flex-1 flex-col'>
          <MessageList messages={messages} />
        </div>
        <MessageComposer onSendText={sendText} onSendAudio={sendAudio} />
      </section>
    </PageShell>
  )
}
