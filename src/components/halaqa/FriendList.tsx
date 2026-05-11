'use client'

import { Check, X } from 'lucide-react'
import type { Friendship } from '@/lib/halaqa/types'
import { Avatar } from './Avatar'

type Props = {
  accepted: Friendship[]
  incoming: Friendship[]
  outgoing: Friendship[]
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export const FriendList = ({ accepted, incoming, outgoing, onAccept, onDecline, onRemove }: Props) => {
  return (
    <div className='flex flex-col gap-5'>
      {incoming.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h3 className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>
            Demandes reçues ({incoming.length})
          </h3>
          <ul className='flex flex-col gap-2'>
            {incoming.map(f => (
              <li key={f.id} className='card flex items-center justify-between gap-3 px-3 py-2.5'>
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar profile={f.friend} size='md' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-ivory-50'>{f.friend.display_name}</p>
                    <p className='truncate text-[11px] text-ivory-100/50'>@{f.friend.username}</p>
                  </div>
                </div>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => onAccept(f.id)}
                    className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-400/20 text-gold-200 ring-1 ring-gold-400/40 hover:bg-gold-400/30'
                    aria-label='Accepter'
                  >
                    <Check className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onDecline(f.id)}
                    className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-ivory-100/60 ring-1 ring-white/10 hover:bg-white/10'
                    aria-label='Refuser'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className='flex flex-col gap-2'>
        <h3 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/50'>
          Mes amis ({accepted.length})
        </h3>
        {accepted.length === 0 ? (
          <p className='text-center text-xs text-ivory-100/40 py-6'>
            Aucun ami pour l&apos;instant
          </p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {accepted.map(f => (
              <li key={f.id} className='card flex items-center justify-between gap-3 px-3 py-2.5'>
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar profile={f.friend} size='md' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-ivory-50'>{f.friend.display_name}</p>
                    <p className='truncate text-[11px] text-ivory-100/50'>@{f.friend.username}</p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => onRemove(f.id)}
                  className='text-[11px] text-ivory-100/40 hover:text-rose-300'
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h3 className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/40'>
            Demandes envoyées ({outgoing.length})
          </h3>
          <ul className='flex flex-col gap-2'>
            {outgoing.map(f => (
              <li
                key={f.id}
                className='card flex items-center justify-between gap-3 px-3 py-2.5 opacity-70'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar profile={f.friend} size='md' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-ivory-50'>{f.friend.display_name}</p>
                    <p className='truncate text-[11px] text-ivory-100/50'>@{f.friend.username}</p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => onRemove(f.id)}
                  className='text-[11px] text-ivory-100/40 hover:text-rose-300'
                >
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
