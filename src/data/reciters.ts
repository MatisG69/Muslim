export type Reciter = {
  id: string
  name: string
  arabicName: string
  bitrate: 128 | 192 | 64
}

export const RECITERS: Reciter[] = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Al-Afasy', arabicName: 'مشاري راشد العفاسي', bitrate: 128 },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', arabicName: 'محمود خليل الحصري', bitrate: 128 },
  { id: 'ar.husarymujawwad', name: 'Al-Husary (Mujawwad)', arabicName: 'الحصري — مجود', bitrate: 128 },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', arabicName: 'محمد صديق المنشاوي', bitrate: 128 },
  { id: 'ar.minshawimujawwad', name: 'Al-Minshawi (Mujawwad)', arabicName: 'المنشاوي — مجود', bitrate: 64 },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Abdus-Samad', arabicName: 'عبد الباسط عبد الصمد', bitrate: 128 },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahman As-Sudais', arabicName: 'عبد الرحمن السديس', bitrate: 64 },
  { id: 'ar.shaatree', name: 'Abu Bakr Ash-Shaatree', arabicName: 'أبو بكر الشاطري', bitrate: 128 },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', arabicName: 'محمد أيوب', bitrate: 128 },
  { id: 'ar.hudhaify', name: 'Ali Al-Hudhaifi', arabicName: 'علي الحذيفي', bitrate: 64 },
  { id: 'ar.muhammadjibreel', name: 'Muhammad Jibreel', arabicName: 'محمد جبريل', bitrate: 128 },
]

export const DEFAULT_RECITER_ID = 'ar.alafasy'

export const buildAyahAudioUrl = (reciter: Reciter, ayahGlobalNumber: number): string =>
  `https://cdn.islamic.network/quran/audio/${reciter.bitrate}/${reciter.id}/${ayahGlobalNumber}.mp3`
