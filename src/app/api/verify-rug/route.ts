import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = `You are a strict visual classifier for a Muslim prayer alarm app.

Your job: determine whether the given photo shows a Muslim prayer rug (sajjadah) clearly and unambiguously.

A prayer rug typically has:
- A rectangular shape
- A mihrab arch (pointed niche shape) at one end
- Geometric or floral Islamic patterns
- Often dark colors with intricate woven borders
- Sometimes Kaaba imagery, Arabic calligraphy, or mosque silhouettes

REJECT (is_prayer_rug=false) when the photo shows:
- A bare wall, a face/selfie, a ceiling, the sky
- Just a floor, regular carpet, doormat, bath mat
- A rolled-up rug where the pattern is not visible
- An image too dark, too blurry, or too far to identify the pattern
- A picture/screenshot of a prayer rug on a screen

ACCEPT (is_prayer_rug=true) only when:
- A real prayer rug fills a meaningful portion of the frame
- Its distinctive Islamic pattern (mihrab, geometric/floral motifs) is clearly visible
- Confidence is high

Be strict. False positives defeat the purpose of the alarm. When in doubt, reject.

Respond with ONLY valid JSON, no prose:
{"is_prayer_rug": boolean, "confidence": number 0..1, "reason": "short French sentence"}`

const parseDataUrl = (input: string): { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } | null => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(input)
  if (!m) return null
  return { mediaType: m[1] as 'image/jpeg' | 'image/png' | 'image/webp', data: m[2] }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 })
  }

  let body: { image?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = body.image ? parseDataUrl(body.image) : null
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: parsed.mediaType, data: parsed.data },
            },
            { type: 'text', text: 'Classify this photo. Respond with JSON only.' },
          ],
        },
      ],
    })

    const text = message.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { is_prayer_rug: false, confidence: 0, reason: 'Réponse du modèle illisible.' },
        { status: 200 },
      )
    }

    const parsedResult = JSON.parse(jsonMatch[0]) as {
      is_prayer_rug?: unknown
      confidence?: unknown
      reason?: unknown
    }

    return NextResponse.json({
      is_prayer_rug: Boolean(parsedResult.is_prayer_rug),
      confidence:
        typeof parsedResult.confidence === 'number'
          ? Math.max(0, Math.min(1, parsedResult.confidence))
          : 0,
      reason: typeof parsedResult.reason === 'string' ? parsedResult.reason : '',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
