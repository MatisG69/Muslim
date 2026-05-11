'use client'

import { motion } from 'framer-motion'
import { BookOpen, Compass, Home, MoreHorizontal, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { NavSheet } from './NavSheet'

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
]

const SHEET_PATHS = ['/tasbih', '/calendar', '/ablutions', '/planner', '/recitation', '/settings']

export const BottomNav = () => {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const moreActive = SHEET_PATHS.some(p => pathname.startsWith(p))

  return (
    <>
      <nav
        className='fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)] pt-2'
        aria-label='Navigation principale'
      >
        <div className='glass relative mx-auto flex items-center justify-between rounded-full border-white/10 px-1.5 py-1.5 backdrop-blur-2xl'>
          {ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
            />
          ))}

          <button
            type='button'
            onClick={() => setSheetOpen(true)}
            aria-label='Plus'
            aria-expanded={sheetOpen}
            className={`group relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition-colors ${
              moreActive ? 'text-gold-300' : 'text-ivory-100/60 hover:text-ivory-100'
            }`}
          >
            {moreActive && (
              <motion.span
                layoutId='nav-pill'
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className='absolute inset-1 rounded-full bg-gold-400/15 ring-1 ring-gold-400/40'
                aria-hidden
              />
            )}
            <span className='relative flex h-9 w-9 items-center justify-center rounded-full'>
              <MoreHorizontal className='h-4 w-4' />
            </span>
            <span className='relative text-[10px] font-medium tracking-wide'>Plus</span>
          </button>
        </div>
      </nav>

      <NavSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

const NavItem = ({ item, active }: { item: Item; active: boolean }) => {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition-colors ${
        active ? 'text-gold-300' : 'text-ivory-100/60 hover:text-ivory-100'
      }`}
    >
      {active && (
        <motion.span
          layoutId='nav-pill'
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className='absolute inset-1 rounded-full bg-gold-400/15 ring-1 ring-gold-400/40'
          aria-hidden
        />
      )}
      <span className='relative flex h-9 w-9 items-center justify-center rounded-full'>
        <Icon className='h-4 w-4' />
      </span>
      <span className='relative text-[10px] font-medium tracking-wide'>{item.label}</span>
    </Link>
  )
}
