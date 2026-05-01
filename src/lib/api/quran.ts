const BASE = 'https://api.alquran.cloud/v1'

export type SurahMeta = {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export type Ayah = {
  number: number
  numberInSurah: number
  text: string
  juz: number
  page: number
}

export type SurahDetail = {
  meta: SurahMeta
  arabic: Ayah[]
  french: Ayah[]
  transliteration: Ayah[]
}

export const fetchSurahsList = async (): Promise<SurahMeta[]> => {
  const res = await fetch(`${BASE}/surah`, { next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!res.ok) throw new Error(`Quran ${res.status}`)
  const json = await res.json()
  return (json.data as Array<Record<string, any>>).map(s => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
  }))
}

const fetchEdition = async (surah: number, edition: string): Promise<{ ayahs: Ayah[]; meta: SurahMeta }> => {
  const res = await fetch(`${BASE}/surah/${surah}/${edition}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  })
  if (!res.ok) throw new Error(`Quran ${res.status}`)
  const json = await res.json()
  const data = json.data
  return {
    ayahs: (data.ayahs as Array<Record<string, any>>).map(a => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
      juz: a.juz,
      page: a.page,
    })),
    meta: {
      number: data.number,
      name: data.name,
      englishName: data.englishName,
      englishNameTranslation: data.englishNameTranslation,
      numberOfAyahs: data.numberOfAyahs,
      revelationType: data.revelationType,
    },
  }
}

export const fetchSurahDetail = async (surah: number): Promise<SurahDetail> => {
  const [arabic, french, transliteration] = await Promise.all([
    fetchEdition(surah, 'quran-uthmani'),
    fetchEdition(surah, 'fr.hamidullah'),
    fetchEdition(surah, 'en.transliteration'),
  ])
  return {
    meta: arabic.meta,
    arabic: arabic.ayahs,
    french: french.ayahs,
    transliteration: transliteration.ayahs,
  }
}
