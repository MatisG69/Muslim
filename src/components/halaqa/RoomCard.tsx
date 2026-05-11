'use client'

import { motion } from 'framer-motion'
import { BookOpen, MessageCircle, Mic2, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import type { Room, RoomKind } from '@/lib/halaqa/types'

const KIND_META: Record<RoomKind, { label: string; icon: typeof Mic2 }> = {
  recitation: { label: 'Récitation', icon: Mic2 },
  reminder: { label: 'Rappel', icon: Sparkles },
  story: { label: 'Histoire', icon: BookOpen },
  mixed: { label: 'Halaqa', icon: MessageCircle },
}

type Props = {
  room: Room
  index?: number
}

export const RoomCard = ({ room, index = 0 }: Props) => {
  const meta = KIND_META[room.kind]
  const Icon = meta.icon

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/halaqa/rooms/${room.id}`}
        className='card flex items-center gap-4 px-4 py-3.5 transition-transform hover:scale-[1.01] active:scale-[0.99]'
      >
        <span className='flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-b from-gold-300/15 to-emerald-900/40 ring-1 ring-gold-400/30'>
          <Icon className='h-5 w-5 text-gold-200' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium text-ivory-50'>{room.title}</p>
          <p className='mt-0.5 flex items-center gap-2 text-[11px] text-ivory-100/50'>
            <span>{meta.label}</span>
            <span className='inline-block h-1 w-1 rounded-full bg-ivory-100/30' />
            <span className='inline-flex items-center gap-1'>
              <Users className='h-3 w-3' />
              {room.is_group ? 'Groupe' : '1v1'}
            </span>
          </p>
        </div>
      </Link>
    </motion.li>
  )
}
