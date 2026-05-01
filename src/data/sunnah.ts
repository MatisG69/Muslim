export type SunnahReminder = {
  id: string
  title: string
  text: string
  source: string
  category: 'matin' | 'soir' | 'priere' | 'quotidien' | 'vendredi' | 'repas' | 'sommeil' | 'social'
}

export const SUNNAH_REMINDERS: SunnahReminder[] = [
  {
    id: 'bismillah',
    title: 'Commencer par Bismillah',
    text: 'Dire « Bismillah » avant chaque action importante : manger, boire, sortir, monter en voiture.',
    source: 'Sahih',
    category: 'quotidien',
  },
  {
    id: 'siwak',
    title: 'Le Siwak',
    text: 'Le Prophète ﷺ utilisait le siwak avant chaque prière et après chaque réveil.',
    source: 'Bukhari',
    category: 'priere',
  },
  {
    id: 'right-hand',
    title: 'Utiliser la main droite',
    text: 'Manger, boire et donner avec la main droite, suivant la sunnah du Prophète ﷺ.',
    source: 'Muslim',
    category: 'repas',
  },
  {
    id: 'three-sips',
    title: 'Boire en trois fois',
    text: 'Boire l’eau en trois gorgées, en faisant une pause à chaque fois.',
    source: 'Muslim',
    category: 'repas',
  },
  {
    id: 'smile',
    title: 'Sourire est une charité',
    text: '« Sourire au visage de ton frère est une aumône pour toi. »',
    source: 'Tirmidhi',
    category: 'social',
  },
  {
    id: 'mu-awwidhat',
    title: 'Les trois sourates protectrices avant de dormir',
    text: 'Réciter Al-Ikhlas, Al-Falaq et An-Nas, souffler dans les paumes et les passer sur le corps trois fois.',
    source: 'Bukhari',
    category: 'sommeil',
  },
  {
    id: 'morning-dua',
    title: 'Dou’a au réveil',
    text: 'Alhamdoulillahi alladhi ahyana ba’da ma amatana wa ilayhi an-nuchour.',
    source: 'Bukhari',
    category: 'matin',
  },
  {
    id: 'sleep-dua',
    title: 'Dou’a avant de dormir',
    text: 'Bismika Allahumma amoutou wa ahya — En Ton nom Ô Allah, je meurs et je vis.',
    source: 'Bukhari',
    category: 'sommeil',
  },
  {
    id: 'duha',
    title: 'La prière de Doha',
    text: '2 à 8 raka’ats entre le lever du soleil et midi : équivalentes à une charité pour chaque articulation du corps.',
    source: 'Muslim',
    category: 'matin',
  },
  {
    id: 'fasting-monday',
    title: 'Jeûner le lundi et le jeudi',
    text: 'Le Prophète ﷺ jeûnait ces jours-là car les actions y sont présentées à Allah.',
    source: 'Tirmidhi',
    category: 'quotidien',
  },
  {
    id: 'kahf',
    title: 'Sourate Al-Kahf le vendredi',
    text: 'La réciter procure une lumière entre les deux vendredis.',
    source: 'Hakim',
    category: 'vendredi',
  },
  {
    id: 'salawat-friday',
    title: 'Multiplier les salawat le vendredi',
    text: '« Multipliez les invocations sur moi le jour du vendredi, car elles me sont présentées. »',
    source: 'Abu Dawud',
    category: 'vendredi',
  },
  {
    id: 'ghusl-friday',
    title: 'Ghusl avant Jumu’ah',
    text: 'Se laver complètement, se parfumer et porter ses meilleurs habits avant la prière du vendredi.',
    source: 'Bukhari',
    category: 'vendredi',
  },
  {
    id: 'ayat-kursi',
    title: 'Ayat al-Kursi après chaque prière',
    text: 'Celui qui la récite après chaque prière obligatoire n’a rien qui l’empêche d’entrer au Paradis sauf la mort.',
    source: 'Nasa’i',
    category: 'priere',
  },
  {
    id: 'azkar-morning',
    title: 'Adhkar du matin',
    text: 'Réciter les invocations du matin après Fajr fortifie la foi pour la journée.',
    source: 'Sunnah',
    category: 'matin',
  },
  {
    id: 'azkar-evening',
    title: 'Adhkar du soir',
    text: 'Les invocations du soir entre Asr et Maghrib protègent la nuit.',
    source: 'Sunnah',
    category: 'soir',
  },
  {
    id: 'witr',
    title: 'Ne pas oublier le Witr',
    text: 'Conclure la nuit par une prière impaire (1, 3, 5...) avant de dormir.',
    source: 'Bukhari',
    category: 'sommeil',
  },
  {
    id: 'salam',
    title: 'Propager le salam',
    text: '« Vous n’entrerez pas au Paradis tant que vous n’aurez pas la foi, et vous ne serez croyants qu’en vous aimant. Voulez-vous que je vous indique ce qui vous y conduira ? Propagez le salam entre vous. »',
    source: 'Muslim',
    category: 'social',
  },
]

export const getDailySunnah = (date = new Date()): SunnahReminder => {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return SUNNAH_REMINDERS[dayOfYear % SUNNAH_REMINDERS.length]
}

export const getFridayReminders = (): SunnahReminder[] =>
  SUNNAH_REMINDERS.filter(s => s.category === 'vendredi')
