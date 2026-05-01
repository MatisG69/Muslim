type Variant = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'default'

const GRADIENTS: Record<Variant, string> = {
  fajr: 'from-[#1a1438] via-[#3d2a5c] to-[#a86a8e]',
  dhuhr: 'from-[#1d6450] via-[#2a8068] to-[#d4a957]',
  asr: 'from-[#7e5821] via-[#c08e3a] to-[#e0c167]',
  maghrib: 'from-[#3d1f4a] via-[#c94f6d] to-[#ff8b5a]',
  isha: 'from-[#0a1410] via-[#15493b] to-[#0f3a2e]',
  default: 'from-emerald-950 via-emerald-900 to-ink-900',
}

export const PrayerGradient = ({ variant }: { variant: Variant }) => (
  <div
    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 ${GRADIENTS[variant]}`}
    aria-hidden
  />
)

export const variantFor = (name: string): Variant => {
  switch (name) {
    case 'Fajr':
      return 'fajr'
    case 'Dhuhr':
      return 'dhuhr'
    case 'Asr':
      return 'asr'
    case 'Maghrib':
      return 'maghrib'
    case 'Isha':
      return 'isha'
    default:
      return 'default'
  }
}
