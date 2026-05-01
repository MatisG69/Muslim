import { normalizeArabic, wordSimilarity } from './normalizeArabic'

export type WordStatus = 'pending' | 'matched' | 'mistake' | 'current'

export type AlignmentResult = {
  newCursor: number
  matched: number
  firstMistake: { expectedIndex: number; expected: string; heard: string } | null
}

const SIMILARITY_THRESHOLD = 0.7

export const alignChunk = (
  expectedNormalized: string[],
  cursor: number,
  heardWords: string[],
  windowExtra = 4,
): AlignmentResult => {
  if (heardWords.length === 0 || cursor >= expectedNormalized.length) {
    return { newCursor: cursor, matched: 0, firstMistake: null }
  }

  const windowEnd = Math.min(
    expectedNormalized.length,
    cursor + heardWords.length + windowExtra,
  )
  const window = expectedNormalized.slice(cursor, windowEnd)

  let expectedIdx = 0
  let heardIdx = 0
  let matched = 0
  let firstMistake: AlignmentResult['firstMistake'] = null

  while (heardIdx < heardWords.length && expectedIdx < window.length) {
    const heardWord = heardWords[heardIdx]
    const expectedWord = window[expectedIdx]

    if (wordSimilarity(heardWord, expectedWord) >= SIMILARITY_THRESHOLD) {
      matched++
      expectedIdx++
      heardIdx++
      continue
    }

    const skipExpected = window[expectedIdx + 1]
    if (
      skipExpected &&
      wordSimilarity(heardWord, skipExpected) >= SIMILARITY_THRESHOLD
    ) {
      if (!firstMistake) {
        firstMistake = {
          expectedIndex: cursor + expectedIdx,
          expected: expectedWord,
          heard: '(omis)',
        }
      }
      expectedIdx += 1
      continue
    }

    const skipHeard = heardWords[heardIdx + 1]
    if (skipHeard && wordSimilarity(skipHeard, expectedWord) >= SIMILARITY_THRESHOLD) {
      heardIdx += 1
      continue
    }

    if (!firstMistake) {
      firstMistake = {
        expectedIndex: cursor + expectedIdx,
        expected: expectedWord,
        heard: heardWord,
      }
    }
    expectedIdx++
    heardIdx++
  }

  return {
    newCursor: cursor + expectedIdx,
    matched,
    firstMistake,
  }
}

export const tokenizeAyahs = (
  arabicAyahs: { numberInSurah: number; text: string }[],
): { tokens: string[]; ayahIndex: number[] } => {
  const tokens: string[] = []
  const ayahIndex: number[] = []
  for (const ayah of arabicAyahs) {
    const norm = normalizeArabic(ayah.text)
    if (!norm) continue
    const ayahTokens = norm.split(' ').filter(Boolean)
    for (const t of ayahTokens) {
      tokens.push(t)
      ayahIndex.push(ayah.numberInSurah)
    }
  }
  return { tokens, ayahIndex }
}

const BISMILLAH_RE = /^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/

export const tokenizeAyahsKeepOriginal = (
  arabicAyahs: { numberInSurah: number; text: string }[],
  surahNumber: number,
): { displayTokens: { word: string; ayah: number; tokenIndex: number }[] } => {
  const displayTokens: { word: string; ayah: number; tokenIndex: number }[] = []
  let tokenIndex = 0
  for (const ayah of arabicAyahs) {
    const text =
      ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9
        ? ayah.text.replace(BISMILLAH_RE, '')
        : ayah.text
    const words = text.trim().split(/\s+/).filter(Boolean)
    for (const word of words) {
      if (normalizeArabic(word).length === 0) continue
      displayTokens.push({ word, ayah: ayah.numberInSurah, tokenIndex })
      tokenIndex++
    }
  }
  return { displayTokens }
}
