const BASE = 'https://api.aladhan.com/v1'

export type HijriDay = {
  hijri: { day: string; month: string; year: string; weekday: string; date: string }
  gregorian: { day: string; month: string; year: string; date: string }
  isToday: boolean
}

export const fetchGregorianMonth = async (month: number, year: number): Promise<HijriDay[]> => {
  const url = `${BASE}/gToHCalendar/${month}/${year}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Hijri calendar ${res.status}`)
  const json = await res.json()
  if (json.code !== 200) throw new Error(`Hijri: ${json.status}`)

  const today = new Date()
  const todayKey = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`

  return (json.data as Array<Record<string, any>>).map(d => {
    const gregKey = `${parseInt(d.gregorian.day, 10)}-${parseInt(d.gregorian.month.number, 10)}-${parseInt(d.gregorian.year, 10)}`
    return {
      hijri: {
        day: d.hijri.day,
        month: d.hijri.month.en,
        year: d.hijri.year,
        weekday: d.hijri.weekday.en,
        date: d.hijri.date,
      },
      gregorian: {
        day: d.gregorian.day,
        month: d.gregorian.month.en,
        year: d.gregorian.year,
        date: d.gregorian.date,
      },
      isToday: gregKey === todayKey,
    }
  })
}

export const HIJRI_MONTHS_FR: Record<string, string> = {
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

export const HIJRI_MONTHS_AR: Record<string, string> = {
  Muharram: 'محرم',
  Safar: 'صفر',
  'Rabīʿ al-awwal': 'ربيع الأول',
  'Rabīʿ al-thānī': 'ربيع الثاني',
  'Jumādá al-ūlá': 'جمادى الأولى',
  'Jumādá al-ākhirah': 'جمادى الآخرة',
  Rajab: 'رجب',
  Shaʿbān: 'شعبان',
  Ramaḍān: 'رمضان',
  Shawwāl: 'شوال',
  'Ḏū al-Qaʿdah': 'ذو القعدة',
  'Ḏū al-Ḥijjah': 'ذو الحجة',
}

export const hijriMonthFr = (en: string): string => HIJRI_MONTHS_FR[en] ?? en
export const hijriMonthAr = (en: string): string => HIJRI_MONTHS_AR[en] ?? en
