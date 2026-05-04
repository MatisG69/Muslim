import type { PrayerName } from '@/types/prayer'

export type Emphasis = 'muakkadah' | 'sunnah' | 'mustahabb'

export type RawatibPrayer = {
  id: string
  rakaat: number
  emphasis: Emphasis
  position: 'before' | 'after'
  attachedTo: PrayerName
  note?: string
}

export type TimeBasedPrayer = {
  id: string
  name: string
  arabicName: string
  rakaat: string
  emphasis: Emphasis
  windowKey: 'duha' | 'tahajjud' | 'witr' | 'tahiyyat'
  description: string
  reward?: string
}

export const RAWATIB: RawatibPrayer[] = [
  {
    id: 'fajr-before',
    rakaat: 2,
    emphasis: 'muakkadah',
    position: 'before',
    attachedTo: 'Fajr',
    note: '« Meilleures que ce monde et ce qu\'il contient » (Muslim)',
  },
  {
    id: 'dhuhr-before',
    rakaat: 4,
    emphasis: 'muakkadah',
    position: 'before',
    attachedTo: 'Dhuhr',
    note: '2 par 2 — ou 2 si pressé',
  },
  {
    id: 'dhuhr-after',
    rakaat: 2,
    emphasis: 'muakkadah',
    position: 'after',
    attachedTo: 'Dhuhr',
  },
  {
    id: 'asr-before',
    rakaat: 4,
    emphasis: 'sunnah',
    position: 'before',
    attachedTo: 'Asr',
    note: 'Ghayr mu\'akkadah — 2 par 2',
  },
  {
    id: 'maghrib-before',
    rakaat: 2,
    emphasis: 'mustahabb',
    position: 'before',
    attachedTo: 'Maghrib',
    note: 'Entre l\'adhan et l\'iqama',
  },
  {
    id: 'maghrib-after',
    rakaat: 2,
    emphasis: 'muakkadah',
    position: 'after',
    attachedTo: 'Maghrib',
  },
  {
    id: 'isha-before',
    rakaat: 2,
    emphasis: 'mustahabb',
    position: 'before',
    attachedTo: 'Isha',
    note: 'Entre l\'adhan et l\'iqama',
  },
  {
    id: 'isha-after',
    rakaat: 2,
    emphasis: 'muakkadah',
    position: 'after',
    attachedTo: 'Isha',
  },
]

export const TIME_BASED_PRAYERS: TimeBasedPrayer[] = [
  {
    id: 'duha',
    name: 'Duha (Ishraq)',
    arabicName: 'صلاة الضحى',
    rakaat: '2 à 8',
    emphasis: 'sunnah',
    windowKey: 'duha',
    description: 'Du lever du soleil (15 min après) jusqu\'à un peu avant Dhuhr',
    reward: '« Aumône pour chacune des 360 articulations du corps » (Muslim)',
  },
  {
    id: 'witr',
    name: 'Witr',
    arabicName: 'صلاة الوتر',
    rakaat: '1, 3, 5, 7 ou 9 (impair)',
    emphasis: 'muakkadah',
    windowKey: 'witr',
    description: 'Après Isha, jusqu\'à l\'aube — clôture les prières de la nuit',
    reward: '« Allah est Witr et aime le Witr » (Tirmidhi)',
  },
  {
    id: 'tahajjud',
    name: 'Tahajjud (Qiyam al-Layl)',
    arabicName: 'صلاة التهجد',
    rakaat: '2 à 12 (2 par 2)',
    emphasis: 'sunnah',
    windowKey: 'tahajjud',
    description: 'Dernier tiers de la nuit — meilleur moment pour invoquer',
    reward: '« La meilleure prière après les obligatoires est la prière de la nuit » (Muslim)',
  },
]

export const rawatibFor = (prayer: PrayerName): RawatibPrayer[] =>
  RAWATIB.filter(r => r.attachedTo === prayer)

export const formatRawatibSummary = (list: RawatibPrayer[]): string => {
  const before = list.filter(r => r.position === 'before')
  const after = list.filter(r => r.position === 'after')
  const parts: string[] = []
  if (before.length) parts.push(`${before.map(r => r.rakaat).join('+')} avant`)
  if (after.length) parts.push(`${after.map(r => r.rakaat).join('+')} après`)
  return parts.join(' · ')
}
