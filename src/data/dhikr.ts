export type Dhikr = {
  id: string
  arabic: string
  transliteration: string
  french: string
  target: number
  source?: string
}

export const DHIKR_LIST: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    french: 'Gloire à Allah',
    target: 33,
    source: 'Tasbih après la prière',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    french: 'Louange à Allah',
    target: 33,
    source: 'Tasbih après la prière',
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    french: 'Allah est le plus grand',
    target: 34,
    source: 'Tasbih après la prière',
  },
  {
    id: 'la-ilaha',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illa Allah',
    french: 'Il n’y a de dieu qu’Allah',
    target: 100,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    french: 'Je demande pardon à Allah',
    target: 100,
  },
  {
    id: 'la-hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    french: 'Il n’y a de force ni de puissance qu’en Allah',
    target: 100,
  },
  {
    id: 'salat-nabi',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    french: 'Ô Allah, prie sur Muhammad',
    target: 100,
    source: 'Salawat',
  },
  {
    id: 'subhanallah-bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'SubhanAllahi wa bihamdihi',
    french: 'Gloire et louange à Allah',
    target: 100,
    source: 'Bukhari & Muslim',
  },
  {
    id: 'subhanallah-azim',
    arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'SubhanAllahi al-Azim',
    french: 'Gloire à Allah, l’Immense',
    target: 100,
    source: 'Bukhari',
  },
  {
    id: 'hasbiyallah',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    transliteration: 'Hasbiyallahu la ilaha illa Huwa',
    french: 'Allah me suffit, il n’y a de dieu que Lui',
    target: 7,
    source: 'At-Tawbah 9:129',
  },
]
