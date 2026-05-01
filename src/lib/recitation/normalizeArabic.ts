const TASHKEEL_REGEX = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿﹰ-ﹿ]/g
const TATWEEL = /ـ/g
const NON_ARABIC = /[^ء-غف-ي٠-٩ ]/g

const ALIF_VARIANTS = /[آأإٱٲٳ]/g
const YA_VARIANTS = /[ى]/g
const TA_MARBUTA = /ة/g
const HAMZA_VARIANTS = /[ئؤ]/g

export const stripTashkeel = (text: string): string =>
  text.replace(TASHKEEL_REGEX, '').replace(TATWEEL, '')

export const normalizeArabic = (text: string): string => {
  if (!text) return ''
  return text
    .replace(TASHKEEL_REGEX, '')
    .replace(TATWEEL, '')
    .replace(ALIF_VARIANTS, 'ا')
    .replace(YA_VARIANTS, 'ي')
    .replace(TA_MARBUTA, 'ه')
    .replace(HAMZA_VARIANTS, 'ء')
    .replace(NON_ARABIC, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const tokenize = (text: string): string[] => {
  const norm = normalizeArabic(text)
  if (!norm) return []
  return norm.split(' ').filter(Boolean)
}

export const wordSimilarity = (a: string, b: string): number => {
  if (a === b) return 1
  if (!a || !b) return 0
  const longer = a.length >= b.length ? a : b
  const shorter = a.length >= b.length ? b : a
  if (longer.length === 0) return 1
  const distance = levenshtein(a, b)
  return 1 - distance / longer.length
}

export const levenshtein = (a: string, b: string): number => {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = new Array(n + 1).fill(0).map((_, i) => i)
  let curr = new Array(n + 1).fill(0)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]
}
