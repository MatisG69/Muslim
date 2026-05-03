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
    source: 'Après la prière (Muslim)',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    french: 'Louange à Allah',
    target: 33,
    source: 'Après la prière (Muslim)',
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    french: 'Allah est le plus grand',
    target: 34,
    source: 'Après la prière (Muslim)',
  },
  {
    id: 'astaghfirullah-3',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    french: 'Je demande pardon à Allah',
    target: 3,
    source: 'Après le salam (Muslim)',
  },
  {
    id: 'allahumma-anta-salam',
    arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Allahumma anta as-Salam wa minka as-salam, tabarakta ya Dhal-Jalali wal-Ikram',
    french: 'Ô Allah, Tu es la Paix et de Toi vient la paix. Béni sois-Tu, Ô Détenteur de la Majesté et de la Générosité',
    target: 1,
    source: 'Muslim',
  },
  {
    id: 'ayat-al-kursi',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration: 'Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...',
    french: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même… Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très-Haut, le Très-Grand. (2:255)',
    target: 1,
    source: 'Quiconque la récite après chaque prière n\'aura d\'obstacle au Paradis que la mort (An-Nasai)',
  },
  {
    id: 'la-ilaha-extended',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illa Allah wahdahu la sharika lah, lahul-mulku wa lahul-hamd wa Huwa ala kulli shay\'in qadir',
    french: 'Il n\'y a de dieu qu\'Allah, Seul, sans associé. À Lui la royauté et la louange. Il est puissant sur toute chose',
    target: 10,
    source: 'Après Maghrib & Fajr (Tirmidhi)',
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
    french: 'Il n\'y a de force ni de puissance qu\'en Allah',
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
    french: 'Gloire à Allah, l\'Immense',
    target: 100,
    source: 'Bukhari',
  },
  {
    id: 'hasbiyallah',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    transliteration: 'Hasbiyallahu la ilaha illa Huwa',
    french: 'Allah me suffit, il n\'y a de dieu que Lui',
    target: 7,
    source: 'At-Tawbah 9:129',
  },
]
