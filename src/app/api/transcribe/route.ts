import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const PROVIDER = process.env.TRANSCRIBE_PROVIDER ?? 'openai'

const HF_MODEL = process.env.HF_MODEL ?? 'tarteel-ai/whisper-base-ar-quran'
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1'

const ext = (mime: string): string => {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  if (mime.includes('wav')) return 'wav'
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3'
  return 'webm'
}

async function transcribeWithOpenAI(audio: Blob, mime: string): Promise<{ text: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const filename = `audio.${ext(mime)}`
  const form = new FormData()
  form.append('file', audio, filename)
  form.append('model', OPENAI_MODEL)
  form.append('language', 'ar')
  form.append('response_format', 'json')

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 250)}`)
  }
  const data = (await res.json()) as { text?: string }
  return { text: data.text ?? '' }
}

async function transcribeWithHF(audio: ArrayBuffer, mime: string): Promise<{ text: string; coldStart: boolean }> {
  const token = process.env.HF_TOKEN
  if (!token) throw new Error('HF_TOKEN missing')

  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': mime },
    body: audio,
  })

  if (res.status === 503) return { text: '', coldStart: true }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HF ${res.status}: ${text.slice(0, 250)}`)
  }
  const data = (await res.json()) as { text?: string } | Array<{ text?: string }>
  const text = Array.isArray(data) ? data[0]?.text ?? '' : data.text ?? ''
  return { text, coldStart: false }
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? 'audio/webm'

  let audio: ArrayBuffer
  try {
    audio = await req.arrayBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (audio.byteLength < 1024) {
    return NextResponse.json({ text: '', provider: PROVIDER })
  }

  try {
    if (PROVIDER === 'hf') {
      const result = await transcribeWithHF(audio, contentType)
      if (result.coldStart) {
        return NextResponse.json({ error: 'cold_start', text: '' }, { status: 503 })
      }
      return NextResponse.json({ text: result.text, provider: 'hf' })
    }

    const blob = new Blob([audio], { type: contentType })
    const result = await transcribeWithOpenAI(blob, contentType)
    return NextResponse.json({ text: result.text, provider: 'openai' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'
    console.error('[transcribe]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
