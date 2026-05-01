import type { EntireQuran } from '@/lib/api/quran'
import { normalizeArabic, wordSimilarity } from './normalizeArabic'

export type SurahMatch = {
  surahNumber: number
  ayahNumber: number
  startTokenIndex: number
  score: number
}

const BISMILLAH_NORMALIZED = 'بسم الله الرحمن الرحيم'

const stripBismillah = (text: string): string => {
  const norm = normalizeArabic(text)
  if (norm.startsWith(BISMILLAH_NORMALIZED)) {
    return norm.slice(BISMILLAH_NORMALIZED.length).trim()
  }
  return norm
}

const tokenize = (text: string): string[] => {
  const norm = normalizeArabic(text)
  return norm ? norm.split(' ').filter(Boolean) : []
}

const tokensSimilarity = (heard: string[], expected: string[]): number => {
  const len = Math.min(heard.length, expected.length)
  if (len === 0) return 0
  let total = 0
  for (let i = 0; i < len; i++) {
    total += wordSimilarity(heard[i], expected[i])
  }
  return total / len
}

export const detectSurah = (
  heardText: string,
  quran: EntireQuran,
): SurahMatch | null => {
  const heardWithoutBismillah = stripBismillah(heardText)
  const heardTokens = tokenize(heardWithoutBismillah).slice(0, 10)
  if (heardTokens.length < 2) return null

  let best: SurahMatch | null = null

  for (const surah of quran) {
    let surahTokens: string[] = []
    let firstAyahTokens: string[] = []
    let perAyahStart: number[] = []

    for (const ayah of surah.ayahs) {
      const t = tokenize(
        surah.number !== 1 && surah.number !== 9 && ayah.numberInSurah === 1
          ? stripBismillah(ayah.text)
          : ayah.text,
      )
      perAyahStart.push(surahTokens.length)
      surahTokens.push(...t)
      if (ayah.numberInSurah === 1) firstAyahTokens = t
    }

    const directScore = tokensSimilarity(heardTokens, firstAyahTokens.slice(0, heardTokens.length))
    if (directScore >= 0.7) {
      if (!best || directScore > best.score) {
        best = {
          surahNumber: surah.number,
          ayahNumber: 1,
          startTokenIndex: perAyahStart[0] ?? 0,
          score: directScore,
        }
      }
    }

    const maxOffset = Math.min(surahTokens.length - heardTokens.length, 30)
    for (let off = 0; off <= maxOffset; off++) {
      const window = surahTokens.slice(off, off + heardTokens.length)
      const score = tokensSimilarity(heardTokens, window)
      if (score >= 0.75 && (!best || score > best.score)) {
        let ayahNum = 1
        for (let i = 0; i < perAyahStart.length; i++) {
          if (perAyahStart[i] <= off) ayahNum = i + 1
          else break
        }
        best = {
          surahNumber: surah.number,
          ayahNumber: ayahNum,
          startTokenIndex: off,
          score,
        }
      }
    }
  }

  return best
}
