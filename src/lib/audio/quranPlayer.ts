import { buildAyahAudioUrl, type Reciter } from '@/data/reciters'

export type QuranPlayerListener = {
  onAyahChange?: (globalNumber: number, repeatIndex: number) => void
  onEnd?: () => void
  onError?: (msg: string) => void
}

type Range = {
  ayahs: number[]
  repeatPerAyah: number
  repeatRange: number
}

export class QuranPlayer {
  private audio: HTMLAudioElement | null = null
  private reciter: Reciter
  private range: Range | null = null
  private cursor = { ayahIndex: 0, ayahRepeat: 0, rangeRepeat: 0 }
  private listeners: QuranPlayerListener = {}
  private playing = false

  constructor(reciter: Reciter) {
    this.reciter = reciter
  }

  setReciter(reciter: Reciter) {
    this.reciter = reciter
  }

  setListeners(l: QuranPlayerListener) {
    this.listeners = l
  }

  isPlaying(): boolean {
    return this.playing
  }

  play(range: Range): Promise<void> {
    this.stop()
    this.range = range
    this.cursor = { ayahIndex: 0, ayahRepeat: 0, rangeRepeat: 0 }
    return this.playCurrent()
  }

  async resume(): Promise<void> {
    if (!this.audio) return
    try {
      await this.audio.play()
      this.playing = true
    } catch (err) {
      this.listeners.onError?.(String(err))
    }
  }

  pause() {
    this.audio?.pause()
    this.playing = false
  }

  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
      this.audio = null
    }
    this.playing = false
  }

  private playCurrent(): Promise<void> {
    if (!this.range) return Promise.resolve()
    const ayahNum = this.range.ayahs[this.cursor.ayahIndex]
    if (ayahNum == null) return Promise.resolve()

    const url = buildAyahAudioUrl(this.reciter, ayahNum)
    const audio = new Audio(url)
    audio.preload = 'auto'
    this.audio = audio

    audio.addEventListener('ended', () => this.advance())
    audio.addEventListener('error', () => {
      this.listeners.onError?.('Audio non disponible')
      this.advance()
    })

    this.listeners.onAyahChange?.(ayahNum, this.cursor.ayahRepeat)
    return audio.play().then(() => {
      this.playing = true
    }).catch(err => {
      this.listeners.onError?.(String(err))
    })
  }

  private advance() {
    if (!this.range) return
    this.cursor.ayahRepeat += 1
    if (this.cursor.ayahRepeat < this.range.repeatPerAyah) {
      void this.playCurrent()
      return
    }
    this.cursor.ayahRepeat = 0
    this.cursor.ayahIndex += 1
    if (this.cursor.ayahIndex < this.range.ayahs.length) {
      void this.playCurrent()
      return
    }
    this.cursor.ayahIndex = 0
    this.cursor.rangeRepeat += 1
    const isInfinite = this.range.repeatRange < 0
    if (isInfinite || this.cursor.rangeRepeat < this.range.repeatRange) {
      void this.playCurrent()
      return
    }
    this.stop()
    this.listeners.onEnd?.()
  }
}
