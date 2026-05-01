export class AdhanPlayer {
  private audio: HTMLAudioElement | null = null
  private context: AudioContext | null = null
  private gain: GainNode | null = null
  private source: MediaElementAudioSourceNode | null = null

  start(src: string, volume = 1): Promise<void> {
    if (this.audio) this.stop()

    const audio = new Audio(src)
    audio.loop = true
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    this.audio = audio

    try {
      const Ctx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = new Ctx()
        const source = ctx.createMediaElementSource(audio)
        const gain = ctx.createGain()
        gain.gain.value = Math.max(0, Math.min(2, volume * 1.5))
        source.connect(gain).connect(ctx.destination)
        this.context = ctx
        this.source = source
        this.gain = gain
      } else {
        audio.volume = Math.max(0, Math.min(1, volume))
      }
    } catch {
      audio.volume = Math.max(0, Math.min(1, volume))
    }

    return audio.play().catch(() => {
      // autoplay block — caller must trigger from a user gesture
    })
  }

  setVolume(volume: number) {
    const v = Math.max(0, Math.min(2, volume * 1.5))
    if (this.gain) this.gain.gain.value = v
    else if (this.audio) this.audio.volume = Math.min(1, v)
  }

  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.source?.disconnect()
    this.gain?.disconnect()
    this.context?.close().catch(() => {})
    this.context = null
    this.source = null
    this.gain = null
  }
}
