'use client'

import { BookOpen, CalendarDays, Circle, Compass, Home, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ITEMS: Item[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/halaqa', label: 'Halaqa', icon: Users },
  { href: '/quran', label: 'Coran', icon: BookOpen },
  { href: '/qibla', label: 'Qibla', icon: Compass },
  { href: '/tasbih', label: 'Tasbih', icon: Circle },
  { href: '/calendar', label: 'Calend.', icon: CalendarDays },
  { href: '/settings', label: 'Réglages', icon: Settings },
]

export const BottomNav = () => {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)] pt-2'>
      <div className='glass mx-auto flex items-center justify-between rounded-full border-white/10 px-2 py-1.5 backdrop-blur-2xl'>
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`group flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition-colors ${
                active ? 'text-gold-300' : 'text-ivory-100/60 hover:text-ivory-100'
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  active ? 'bg-gold-400/15 ring-1 ring-gold-400/40' : ''
                }`}
              >
                <Icon className='h-4 w-4' />
              </span>
              <span className='text-[10px] font-medium tracking-wide'>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
