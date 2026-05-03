export type WuduStep = {
  id: string
  number: number
  title: string
  arabic?: string
  description: string
  detail?: string
  obligation: 'fard' | 'sunnah'
  repetition?: number
}

export const WUDU_STEPS: WuduStep[] = [
  {
    id: 'niyyah',
    number: 1,
    title: 'Intention (Niyyah)',
    arabic: 'النية',
    description: 'Formuler intérieurement l\'intention de se purifier pour la prière.',
    detail: 'L\'intention reste dans le cœur — elle ne se prononce pas à voix haute.',
    obligation: 'fard',
  },
  {
    id: 'bismillah',
    number: 2,
    title: 'Bismillah',
    arabic: 'بسم الله',
    description: 'Dire « Bismillah » (au nom d\'Allah) avant de commencer.',
    obligation: 'sunnah',
  },
  {
    id: 'hands',
    number: 3,
    title: 'Laver les mains',
    description: 'Laver les deux mains jusqu\'aux poignets, en passant entre les doigts.',
    obligation: 'sunnah',
    repetition: 3,
  },
  {
    id: 'mouth',
    number: 4,
    title: 'Rincer la bouche',
    description: 'Prendre de l\'eau dans la main droite et la faire tourner dans la bouche.',
    detail: 'Si vous n\'êtes pas en jeûne, faites pénétrer l\'eau profondément.',
    obligation: 'sunnah',
    repetition: 3,
  },
  {
    id: 'nose',
    number: 5,
    title: 'Aspirer l\'eau par le nez',
    description: 'Aspirer l\'eau avec la main droite, puis la rejeter avec la gauche.',
    obligation: 'sunnah',
    repetition: 3,
  },
  {
    id: 'face',
    number: 6,
    title: 'Laver le visage',
    description: 'Du front au menton, et d\'une oreille à l\'autre.',
    detail: 'Pour les hommes, faire pénétrer l\'eau dans la barbe.',
    obligation: 'fard',
    repetition: 3,
  },
  {
    id: 'arms',
    number: 7,
    title: 'Laver les bras jusqu\'aux coudes',
    description: 'Bras droit puis bras gauche, en incluant les coudes.',
    obligation: 'fard',
    repetition: 3,
  },
  {
    id: 'head',
    number: 8,
    title: 'Essuyer la tête (Mash)',
    description: 'Passer les mains mouillées de l\'avant à l\'arrière du crâne, puis revenir.',
    obligation: 'fard',
    repetition: 1,
  },
  {
    id: 'ears',
    number: 9,
    title: 'Essuyer les oreilles',
    description: 'Index dans le canal de l\'oreille, pouces derrière les pavillons.',
    obligation: 'sunnah',
    repetition: 1,
  },
  {
    id: 'feet',
    number: 10,
    title: 'Laver les pieds jusqu\'aux chevilles',
    description: 'Pied droit puis pied gauche, en passant entre les orteils.',
    obligation: 'fard',
    repetition: 3,
  },
  {
    id: 'dua',
    number: 11,
    title: 'Invocation finale',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    description: '« J\'atteste qu\'il n\'y a de divinité qu\'Allah, Seul, sans associé, et j\'atteste que Muhammad est Son serviteur et Son messager. »',
    detail: 'Hadith : « Quiconque la récite après les ablutions, les huit portes du Paradis lui sont ouvertes » (Muslim).',
    obligation: 'sunnah',
  },
]

export const WUDU_INVALIDATORS: string[] = [
  'Toute sortie naturelle (urine, selles, gaz)',
  'Sommeil profond (allongé) ou perte de conscience',
  'Contact avec une impureté majeure',
  'Saignement abondant (selon certaines écoles)',
]
