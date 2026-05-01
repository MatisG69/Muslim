export const formatTime = (timeStr: string): string => {
  const [h, m] = timeStr.split(':')
  return `${h}:${m}`
}

export const formatCountdown = (ms: number): string => {
  if (ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

const HIJRI_MONTHS_FR: Record<string, string> = {
  Muharram: 'Mouharram',
  Safar: 'Safar',
  'Rabīʿ al-awwal': 'Rabi al-Awwal',
  'Rabīʿ al-thānī': 'Rabi al-Thani',
  'Jumādá al-ūlá': 'Joumada al-Oula',
  'Jumādá al-ākhirah': 'Joumada al-Thania',
  Rajab: 'Rajab',
  Shaʿbān: 'Chaabane',
  Ramaḍān: 'Ramadan',
  Shawwāl: 'Chawwal',
  'Ḏū al-Qaʿdah': 'Dhou al-Qida',
  'Ḏū al-Ḥijjah': 'Dhou al-Hijja',
}

export const formatHijri = (day: string, month: string, year: string): string => {
  const fr = HIJRI_MONTHS_FR[month] ?? month
  return `${day} ${fr} ${year}`
}

export const formatGregorianDate = (date: Date): string =>
  date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
