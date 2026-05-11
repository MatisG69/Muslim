'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Plus, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageShell } from '@/components/PageShell'
import { RoomCard } from '@/components/halaqa/RoomCard'
import { useAuth } from '@/lib/auth/AuthContext'
import { useFriends } from '@/lib/halaqa/useFriends'
import { useRooms } from '@/lib/halaqa/useRooms'
import { useProfile } from '@/lib/halaqa/useProfile'

export default function HalaqaHubPage() {
  const router = useRouter()
  const { user, loading: authLoading, configured } = useAuth()
  const { profile } = useProfile()
  const { rooms, loading: roomsLoading } = useRooms()
  const { accepted, incoming } = useFriends()

  useEffect(() => {
    if (!authLoading && configured && !user) router.replace('/login')
  }, [authLoading, configured, user, router])

  if (!configured) {
    return (
      <PageShell>
        <Header />
        <div className='card px-6 py-8 text-center'>
          <p className='text-sm text-ivory-100/70'>
            Supabase n&apos;est pas configuré. Renseigne <code>NEXT_PUBLIC_SUPABASE_URL</code> et
            <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Header />

      {profile && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className='card flex items-center justify-between px-4 py-3.5'
        >
          <div>
            <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Mon pseudo</p>
            <p className='mt-0.5 text-sm text-ivory-50'>@{profile.username}</p>
          </div>
          <Link href='/halaqa/friends' className='btn-ghost gap-1.5 text-xs'>
            <UserPlus className='h-3.5 w-3.5' />
            Amis
            {incoming.length > 0 && (
              <span className='ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gold-400/30 px-1 text-[10px] text-gold-100'>
                {incoming.length}
              </span>
            )}
          </Link>
        </motion.section>
      )}

      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-[11px] uppercase tracking-[0.3em] text-ivory-100/50'>Mes halaqas</h2>
          <Link href='/halaqa/rooms/new' className='btn-ghost gap-1.5 text-xs'>
            <Plus className='h-3.5 w-3.5' />
            Nouvelle
          </Link>
        </div>

        {roomsLoading ? (
          <p className='py-6 text-center text-xs text-ivory-100/40'>Chargement…</p>
        ) : rooms.length === 0 ? (
          <div className='card flex flex-col items-center gap-3 py-10 text-center'>
            <span className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/15 ring-1 ring-gold-400/40'>
              <Users className='h-5 w-5 text-gold-200' />
            </span>
            <div>
              <p className='font-serif text-lg text-ivory-50'>Aucune halaqa</p>
              <p className='mt-1 max-w-xs text-xs text-ivory-100/60'>
                Crée une room pour réciter en direct, partager un rappel ou raconter une histoire.
              </p>
            </div>
            <Link href='/halaqa/rooms/new' className='btn-primary text-sm'>
              <Plus className='h-4 w-4' />
              Créer une halaqa
            </Link>
          </div>
        ) : (
          <ul className='flex flex-col gap-2'>
            {rooms.map((r, i) => (
              <RoomCard key={r.id} room={r} index={i} />
            ))}
          </ul>
        )}
      </section>

      {accepted.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h2 className='text-[11px] uppercase tracking-[0.3em] text-ivory-100/50'>
            Amis ({accepted.length})
          </h2>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {accepted.map(f => (
              <Link
                key={f.id}
                href='/halaqa/friends'
                className='flex flex-none flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5 hover:bg-white/[0.06]'
              >
                <span className='font-serif text-sm text-ivory-50'>
                  {f.friend.display_name.split(' ')[0]}
                </span>
                <span className='text-[10px] text-ivory-100/40'>@{f.friend.username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}

const Header = () => (
  <header className='flex items-center gap-3'>
    <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
      <ChevronLeft className='h-4 w-4' />
    </Link>
    <div>
      <h1 className='font-serif text-2xl text-ivory-50'>Halaqa</h1>
      <p className='text-[11px] text-ivory-100/50'>Récite & échange avec tes amis</p>
    </div>
  </header>
)
