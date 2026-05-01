type ChunkHandler = (blob: Blob, mimeType: string) => void

export type ChunkRecorderOptions = {
  chunkMs: number
  onChunk: ChunkHandler
  onError?: (err: Error) => void
}

const pickMimeType = (): string => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

export class ChunkRecorder {
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private chunkMs: number
  private onChunk: ChunkHandler
  private onError?: (err: Error) => void
  private mime: string = ''
  private cycle: ReturnType<typeof setInterval> | null = null
  private active = false

  constructor(opts: ChunkRecorderOptions) {
    this.chunkMs = opts.chunkMs
    this.onChunk = opts.onChunk
    this.onError = opts.onError
  }

  async start(): Promise<void> {
    if (this.active) return
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      this.mime = pickMimeType()
      this.active = true
      this.startCycle()
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  private startCycle() {
    if (!this.stream || !this.active) return

    const startNew = () => {
      if (!this.stream || !this.active) return
      const recorder = new MediaRecorder(
        this.stream,
        this.mime ? { mimeType: this.mime } : undefined,
      )
      const parts: BlobPart[] = []

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) parts.push(e.data)
      }
      recorder.onstop = () => {
        if (parts.length === 0) return
        const blob = new Blob(parts, { type: this.mime || 'audio/webm' })
        if (blob.size > 1024) this.onChunk(blob, blob.type)
      }
      recorder.onerror = ev => {
        const err = (ev as unknown as { error?: Error }).error
        this.onError?.(err ?? new Error('Recorder error'))
      }

      this.recorder = recorder
      recorder.start()

      const timeout = setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop()
      }, this.chunkMs)

      recorder.addEventListener('stop', () => {
        clearTimeout(timeout)
        if (this.active) startNew()
      })
    }

    startNew()
  }

  stop(): void {
    this.active = false
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop()
      } catch {}
    }
    this.recorder = null
    if (this.cycle) clearInterval(this.cycle)
    this.cycle = null
    this.stream?.getTracks().forEach(t => t.stop())
    this.stream = null
  }
}

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
