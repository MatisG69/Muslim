'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageShell } from '@/components/PageShell'
import { FriendList } from '@/components/halaqa/FriendList'
import { FriendSearch } from '@/components/halaqa/FriendSearch'
import { useAuth } from '@/lib/auth/AuthContext'
import { useFriends } from '@/lib/halaqa/useFriends'
import { useProfile } from '@/lib/halaqa/useProfile'

export default function FriendsPage() {
  const router = useRouter()
  const { user, loading: authLoading, configured } = useAuth()
  const { profile } = useProfile()
  const { friendships, accepted, incoming, outgoing, loading, sendRequest, accept, remove } =
    useFriends()

  useEffect(() => {
    if (!authLoading && configured && !user) router.replace('/login')
  }, [authLoading, configured, user, router])

  return (
    <PageShell>
      <header className='flex items-center gap-3'>
        <Link href='/halaqa' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div>
          <h1 className='font-serif text-2xl text-ivory-50'>Amis</h1>
          {profile && (
            <p className='text-[11px] text-ivory-100/50'>Partage ton pseudo @{profile.username}</p>
          )}
        </div>
      </header>

      <FriendSearch friendships={friendships} onAdd={sendRequest} />

      {loading ? (
        <p className='py-6 text-center text-xs text-ivory-100/40'>Chargement…</p>
      ) : (
        <FriendList
          accepted={accepted}
          incoming={incoming}
          outgoing={outgoing}
          onAccept={accept}
          onDecline={remove}
          onRemove={remove}
        />
      )}
    </PageShell>
  )
}
