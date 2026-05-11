'use client'

import { Mic, Send, Square, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

type Props = {
  onSendText: (content: string) => Promise<void>
  onSendAudio: (blob: Blob, durationMs: number) => Promise<void>
  disabled?: boolean
}

export const MessageComposer = ({ onSendText, onSendAudio, disabled }: Props) => {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const tickRef = useRef<number | null>(null)

  const sendText = async () => {
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    try {
      await onSendText(value)
      setText('')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const startRecord = async () => {
    if (recording || disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const duration = Date.now() - startedAtRef.current
        if (blob.size > 0 && duration > 300) {
          setSending(true)
          try {
            await onSendAudio(blob, duration)
          } catch (e) {
            alert((e as Error).message)
          } finally {
            setSending(false)
          }
        }
        setRecording(false)
        setElapsedMs(0)
        if (tickRef.current != null) {
          window.clearInterval(tickRef.current)
          tickRef.current = null
        }
      }
      rec.start()
      recorderRef.current = rec
      startedAtRef.current = Date.now()
      setRecording(true)
      tickRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current)
      }, 200)
    } catch (e) {
      alert('Micro indisponible: ' + (e as Error).message)
    }
  }

  const stopRecord = (cancel = false) => {
    const rec = recorderRef.current
    if (!rec) return
    if (cancel) {
      chunksRef.current = []
      try {
        rec.stop()
      } catch {}
    } else {
      try {
        rec.stop()
      } catch {}
    }
  }

  const secs = Math.floor(elapsedMs / 1000)
  const elapsedLabel = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  if (recording) {
    return (
      <div className='card flex items-center gap-3 px-3 py-2.5'>
        <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 ring-1 ring-rose-400/40'>
          <span className='block h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400' />
        </span>
        <div className='flex flex-1 flex-col'>
          <span className='text-xs text-ivory-100/70'>Enregistrement…</span>
          <span className='font-mono text-[11px] text-ivory-100/40'>{elapsedLabel}</span>
        </div>
        <button
          type='button'
          onClick={() => stopRecord(true)}
          className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-ivory-100/60 ring-1 ring-white/10'
          aria-label='Annuler'
        >
          <Trash2 className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={() => stopRecord(false)}
          className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-[0_8px_30px_-8px_rgba(212,169,87,0.5)]'
          aria-label='Envoyer'
        >
          <Square className='h-3.5 w-3.5' />
        </button>
      </div>
    )
  }

  return (
    <div className='card flex items-end gap-2 px-3 py-2'>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='Écris un message ou un rappel…'
        rows={1}
        disabled={disabled || sending}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendText()
          }
        }}
        className='flex-1 resize-none bg-transparent py-2 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none'
      />
      {text.trim() ? (
        <button
          type='button'
          onClick={sendText}
          disabled={sending || disabled}
          className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 disabled:opacity-40'
          aria-label='Envoyer'
        >
          <Send className='h-4 w-4' />
        </button>
      ) : (
        <button
          type='button'
          onClick={startRecord}
          disabled={disabled || sending}
          className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-ivory-100/70 ring-1 ring-white/10 disabled:opacity-40'
          aria-label='Enregistrer un audio'
        >
          <Mic className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}
