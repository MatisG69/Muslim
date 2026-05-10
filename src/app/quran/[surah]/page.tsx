'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Pause,
  Play,
  Repeat,
  Square,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { fetchSurahDetail, type SurahDetail, type Ayah } from '@/lib/api/quran'
import { QuranPlayer } from '@/lib/audio/quranPlayer'
import { RECITERS, DEFAULT_RECITER_ID, type Reciter } from '@/data/reciters'
import { useSettings } from '@/lib/storage/SettingsContext'

type ContextMenu = {
  ayah: Ayah
  x: number
  y: number
} | null

type RangeState = {
  fromIdx: number
  toIdx: number
  repeatPerAyah: number
  repeatRange: number
}

const cleanArabic = (text: string, isFirstAyah: boolean, surahNumber: number): string => {
  if (surahNumber === 1 || surahNumber === 9) return text
  if (!isFirstAyah) return text
  return text.replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '')
}

export default function SurahReader() {
  const params = useParams<{ surah: string }>()
  const surahNumber = parseInt(params.surah, 10)
  const [data, setData] = useState<SurahDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFrench, setShowFrench] = useState(true)
  const [showTransliteration, setShowTransliteration] = useState(true)

  const { settings, update: updateSettingsCtx } = useSettings()
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID)
  const [mushaf, setMushaf] = useState(false)
  const [showReciterPicker, setShowReciterPicker] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null)
  const [showRangePanel, setShowRangePanel] = useState(false)
  const [range, setRange] = useState<RangeState>({
    fromIdx: 0,
    toIdx: 0,
    repeatPerAyah: 1,
    repeatRange: 1,
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [activeAyahNum, setActiveAyahNum] = useState<number | null>(null)
  const [activeRepeatIdx, setActiveRepeatIdx] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)

  const playerRef = useRef<QuranPlayer | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const ayahRefs = useRef<Record<number, HTMLElement | null>>({})

  const reciter: Reciter = useMemo(
    () => RECITERS.find(r => r.id === reciterId) ?? RECITERS[0],
    [reciterId],
  )

  useEffect(() => {
    setReciterId(settings.preferredReciterId || DEFAULT_RECITER_ID)
    setMushaf(settings.mushafMode)
  }, [settings.preferredReciterId, settings.mushafMode])

  useEffect(() => {
    setData(null)
    setError(null)
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      setError('Sourate invalide')
      return
    }
    fetchSurahDetail(surahNumber)
      .then(d => {
        setData(d)
        setRange({ fromIdx: 0, toIdx: d.arabic.length - 1, repeatPerAyah: 1, repeatRange: 1 })
      })
      .catch(e => setError(String(e)))
  }, [surahNumber])

  useEffect(() => {
    return () => {
      playerRef.current?.stop()
      playerRef.current = null
    }
  }, [])

  const ensurePlayer = (): QuranPlayer => {
    if (!playerRef.current) {
      playerRef.current = new QuranPlayer(reciter)
    } else {
      playerRef.current.setReciter(reciter)
    }
    playerRef.current.setListeners({
      onAyahChange: (num, repeatIdx) => {
        setActiveAyahNum(num)
        setActiveRepeatIdx(repeatIdx)
        const node = ayahRefs.current[num]
        node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      },
      onEnd: () => {
        setIsPlaying(false)
        setActiveAyahNum(null)
        setActiveRepeatIdx(0)
      },
      onError: msg => setAudioError(msg),
    })
    return playerRef.current
  }

  const playRange = (fromIdx: number, toIdx: number, repeatPerAyah = 1, repeatRange = 1) => {
    if (!data) return
    setAudioError(null)
    const player = ensurePlayer()
    const ayahs = data.arabic.slice(fromIdx, toIdx + 1).map(a => a.number)
    player.play({ ayahs, repeatPerAyah, repeatRange })
    setIsPlaying(true)
  }

  const playSingleAyah = (idx: number, repeats = 1) => {
    playRange(idx, idx, repeats, 1)
  }

  const togglePause = () => {
    const player = playerRef.current
    if (!player) return
    if (player.isPlaying()) {
      player.pause()
      setIsPlaying(false)
    } else {
      void player.resume()
      setIsPlaying(true)
    }
  }

  const stopAll = () => {
    playerRef.current?.stop()
    setIsPlaying(false)
    setActiveAyahNum(null)
    setActiveRepeatIdx(0)
  }

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    updateSettingsCtx({ [key]: value })
  }

  const setReciterPersist = (id: string) => {
    setReciterId(id)
    updateSetting('preferredReciterId', id)
  }

  const toggleMushaf = () => {
    const next = !mushaf
    setMushaf(next)
    updateSetting('mushafMode', next)
  }

  const startLongPress = (ayah: Ayah, e: React.PointerEvent) => {
    const x = e.clientX
    const y = e.clientY
    longPressTimerRef.current = window.setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(20)
      setContextMenu({ ayah, x, y })
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current != null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const openRangePanelWithAyah = (ayah: Ayah, mode: 'from' | 'to') => {
    if (!data) return
    const idx = data.arabic.findIndex(a => a.number === ayah.number)
    if (idx === -1) return
    setRange(r => {
      const fromIdx = mode === 'from' ? idx : r.fromIdx
      const toIdx = mode === 'to' ? idx : r.toIdx
      return {
        ...r,
        fromIdx: Math.min(fromIdx, toIdx),
        toIdx: Math.max(fromIdx, toIdx),
      }
    })
    setContextMenu(null)
    setShowRangePanel(true)
  }

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/quran' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div className='flex flex-wrap justify-end gap-2'>
          <button
            onClick={toggleMushaf}
            className={`btn-ghost p-2.5 ${mushaf ? 'text-gold-300' : ''}`}
            aria-label='Mode mushaf'
            title='Mode mushaf'
          >
            <BookOpen className='h-4 w-4' />
          </button>
          <button
            onClick={() => setShowReciterPicker(true)}
            className='btn-ghost p-2.5 text-gold-300'
            aria-label='Récitateur'
            title='Récitateur'
          >
            <Layers className='h-4 w-4' />
          </button>
          <button
            onClick={() => setShowRangePanel(true)}
            className='btn-ghost p-2.5 text-gold-300'
            aria-label='Plage'
            title='Lecture par plage'
          >
            <Repeat className='h-4 w-4' />
          </button>
          {!mushaf && (
            <>
              <button
                onClick={() => setShowTransliteration(v => !v)}
                className={`btn-ghost p-2.5 ${showTransliteration ? 'text-gold-300' : ''}`}
                aria-label='Translittération'
                title='Translittération'
              >
                <span className='text-[10px] font-bold'>Tr</span>
              </button>
              <button
                onClick={() => setShowFrench(v => !v)}
                className={`btn-ghost p-2.5 ${showFrench ? 'text-gold-300' : ''}`}
                aria-label='Traduction'
                title='Traduction française'
              >
                {showFrench ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
              </button>
            </>
          )}
        </div>
      </header>

      {error && <p className='text-sm text-rose-300'>{error}</p>}
      {!data && !error && (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='h-24 animate-pulse rounded-2xl bg-white/[0.03]' />
          ))}
        </div>
      )}

      {data && (
        <>
          {mushaf ? (
            <MushafView
              data={data}
              activeAyahNum={activeAyahNum}
              onLongPressAyah={startLongPress}
              onCancelLongPress={cancelLongPress}
              setAyahRef={(num, el) => (ayahRefs.current[num] = el)}
            />
          ) : (
            <ListView
              data={data}
              showFrench={showFrench}
              showTransliteration={showTransliteration}
              activeAyahNum={activeAyahNum}
              onLongPressAyah={startLongPress}
              onCancelLongPress={cancelLongPress}
              setAyahRef={(num, el) => (ayahRefs.current[num] = el)}
            />
          )}

          <nav className='flex items-center justify-between gap-3 pt-2 pb-32'>
            {surahNumber > 1 ? (
              <Link href={`/quran/${surahNumber - 1}`} className='btn-ghost'>
                <ChevronLeft className='h-4 w-4' />
                Précédente
              </Link>
            ) : (
              <span />
            )}
            {surahNumber < 114 ? (
              <Link href={`/quran/${surahNumber + 1}`} className='btn-primary'>
                Suivante
                <ChevronRight className='h-4 w-4' />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}

      {(isPlaying || activeAyahNum) && (
        <PlaybackBar
          isPlaying={isPlaying}
          activeAyahNum={activeAyahNum}
          activeRepeatIdx={activeRepeatIdx}
          reciterName={reciter.name}
          onTogglePause={togglePause}
          onStop={stopAll}
        />
      )}

      {audioError && (
        <div className='fixed inset-x-0 bottom-32 z-40 mx-auto max-w-md px-4'>
          <div className='card flex items-center justify-between gap-3 px-4 py-2 text-xs text-rose-200'>
            {audioError}
            <button onClick={() => setAudioError(null)} className='text-rose-300/70'>×</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {contextMenu && data && (
          <ContextMenuSheet
            ayah={contextMenu.ayah}
            onClose={() => setContextMenu(null)}
            onPlayOnce={() => {
              const idx = data.arabic.findIndex(a => a.number === contextMenu.ayah.number)
              if (idx !== -1) playSingleAyah(idx, 1)
              setContextMenu(null)
            }}
            onRepeat={(times) => {
              const idx = data.arabic.findIndex(a => a.number === contextMenu.ayah.number)
              if (idx !== -1) playSingleAyah(idx, times)
              setContextMenu(null)
            }}
            onSetRangeStart={() => openRangePanelWithAyah(contextMenu.ayah, 'from')}
            onSetRangeEnd={() => openRangePanelWithAyah(contextMenu.ayah, 'to')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReciterPicker && (
          <ReciterPicker
            current={reciterId}
            onSelect={(id) => {
              setReciterPersist(id)
              setShowReciterPicker(false)
            }}
            onClose={() => setShowReciterPicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRangePanel && data && (
          <RangePanel
            data={data}
            range={range}
            onChange={setRange}
            onPlay={() => {
              playRange(range.fromIdx, range.toIdx, range.repeatPerAyah, range.repeatRange)
              setShowRangePanel(false)
            }}
            onClose={() => setShowRangePanel(false)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}

const ListView = ({
  data,
  showFrench,
  showTransliteration,
  activeAyahNum,
  onLongPressAyah,
  onCancelLongPress,
  setAyahRef,
}: {
  data: SurahDetail
  showFrench: boolean
  showTransliteration: boolean
  activeAyahNum: number | null
  onLongPressAyah: (a: Ayah, e: React.PointerEvent) => void
  onCancelLongPress: () => void
  setAyahRef: (num: number, el: HTMLElement | null) => void
}) => (
  <>
    <section className='card relative overflow-hidden px-6 py-7 text-center'>
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.06]'
        style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
        aria-hidden
      />
      <div className='relative'>
        <p className='text-[10px] uppercase tracking-[0.4em] text-gold-300/70'>
          Sourate {data.meta.number}
        </p>
        <h1 className='mt-2 font-serif text-3xl text-ivory-50'>{data.meta.englishName}</h1>
        <p className='mt-1 text-xs text-ivory-100/60'>
          {data.meta.englishNameTranslation} · {data.meta.numberOfAyahs} versets
        </p>
        <p className='mt-4 font-arabic text-3xl text-gold-200' dir='rtl'>
          {data.meta.name}
        </p>
        {data.meta.number !== 9 && (
          <p className='mt-5 font-arabic text-xl leading-loose text-gold-100/90' dir='rtl'>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        )}
      </div>
    </section>

    <section className='space-y-4'>
      {data.arabic.map((ayah, i) => {
        const fr = data.french[i]
        const tr = data.transliteration[i]
        const arabicText = cleanArabic(ayah.text, i === 0, data.meta.number)
        const isActive = ayah.number === activeAyahNum

        return (
          <article
            key={ayah.number}
            ref={el => setAyahRef(ayah.number, el)}
            onPointerDown={e => onLongPressAyah(ayah, e)}
            onPointerUp={onCancelLongPress}
            onPointerLeave={onCancelLongPress}
            onPointerCancel={onCancelLongPress}
            onContextMenu={e => e.preventDefault()}
            className={`card cursor-pointer select-none px-5 py-5 transition-all ${
              isActive ? 'ring-2 ring-gold-400/60 bg-gold-400/[0.04]' : ''
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <div className='mb-3 flex items-center justify-between'>
              <span className='flex h-7 w-7 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.06] text-[11px] text-gold-200'>
                {ayah.numberInSurah}
              </span>
              <span className='text-[10px] uppercase tracking-[0.3em] text-ivory-100/40'>
                Juz {ayah.juz} · Page {ayah.page}
              </span>
            </div>
            <p
              className='font-arabic text-2xl leading-[2.4] text-ivory-50'
              dir='rtl'
              style={{ wordSpacing: '0.1em' }}
            >
              {arabicText}
            </p>
            {showTransliteration && tr && (
              <p className='mt-3 text-sm italic text-ivory-100/60'>{tr.text}</p>
            )}
            {showFrench && fr && (
              <p className='mt-3 text-sm leading-relaxed text-ivory-100/85'>{fr.text}</p>
            )}
          </article>
        )
      })}
    </section>
  </>
)

const MushafView = ({
  data,
  activeAyahNum,
  onLongPressAyah,
  onCancelLongPress,
  setAyahRef,
}: {
  data: SurahDetail
  activeAyahNum: number | null
  onLongPressAyah: (a: Ayah, e: React.PointerEvent) => void
  onCancelLongPress: () => void
  setAyahRef: (num: number, el: HTMLElement | null) => void
}) => {
  const ayahMarker = (n: number) => ` ۝${n} `

  return (
    <section className='mushaf-page relative overflow-hidden'>
      <div className='mushaf-frame'>
        <div className='mushaf-banner-top'>
          <p className='font-arabic text-base text-amber-900' dir='rtl'>
            {data.meta.name}
          </p>
        </div>

        <div className='mushaf-content' dir='rtl'>
          {data.meta.number !== 9 && (
            <p className='mb-4 text-center font-arabic text-lg text-amber-900'>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          )}
          <p className='font-arabic text-[1.35rem] leading-[2.6] text-stone-900' dir='rtl' style={{ wordSpacing: '0.05em', textAlign: 'justify' }}>
            {data.arabic.map((ayah, i) => {
              const arabicText = cleanArabic(ayah.text, i === 0, data.meta.number)
              const isActive = ayah.number === activeAyahNum
              return (
                <span
                  key={ayah.number}
                  ref={el => setAyahRef(ayah.number, el)}
                  onPointerDown={e => onLongPressAyah(ayah, e)}
                  onPointerUp={onCancelLongPress}
                  onPointerLeave={onCancelLongPress}
                  onPointerCancel={onCancelLongPress}
                  onContextMenu={e => e.preventDefault()}
                  className={`select-none transition-colors ${
                    isActive ? 'rounded bg-amber-300/40 px-1' : ''
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {arabicText}
                  <span className='font-arabic text-amber-800'>{ayahMarker(ayah.numberInSurah)}</span>
                </span>
              )
            })}
          </p>
        </div>

        <div className='mushaf-banner-bottom'>
          <p className='text-[10px] uppercase tracking-[0.3em] text-amber-900'>
            Sourate {data.meta.number} · {data.meta.englishName}
          </p>
        </div>
      </div>
    </section>
  )
}

const PlaybackBar = ({
  isPlaying,
  activeAyahNum,
  activeRepeatIdx,
  reciterName,
  onTogglePause,
  onStop,
}: {
  isPlaying: boolean
  activeAyahNum: number | null
  activeRepeatIdx: number
  reciterName: string
  onTogglePause: () => void
  onStop: () => void
}) => (
  <motion.div
    initial={{ y: 80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 80, opacity: 0 }}
    className='fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md px-4'
  >
    <div className='glass flex items-center justify-between gap-3 rounded-full border border-white/10 px-3 py-2 backdrop-blur-2xl'>
      <button onClick={onTogglePause} className='btn-primary h-10 w-10 rounded-full p-0'>
        {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4 translate-x-[1px]' />}
      </button>
      <div className='flex-1 truncate text-left'>
        <p className='truncate text-xs text-ivory-50'>{reciterName}</p>
        <p className='truncate text-[10px] text-ivory-100/50'>
          {activeAyahNum ? `Verset #${activeAyahNum}` : 'En attente'}
          {activeRepeatIdx > 0 ? ` · répétition ${activeRepeatIdx + 1}` : ''}
        </p>
      </div>
      <button onClick={onStop} className='btn-ghost h-10 w-10 rounded-full p-0'>
        <Square className='h-4 w-4' />
      </button>
    </div>
  </motion.div>
)

const ContextMenuSheet = ({
  ayah,
  onClose,
  onPlayOnce,
  onRepeat,
  onSetRangeStart,
  onSetRangeEnd,
}: {
  ayah: Ayah
  onClose: () => void
  onPlayOnce: () => void
  onRepeat: (times: number) => void
  onSetRangeStart: () => void
  onSetRangeEnd: () => void
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className='fixed inset-0 z-50 flex items-end justify-center bg-ink-900/70 backdrop-blur-sm'
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      exit={{ y: 50 }}
      onClick={e => e.stopPropagation()}
      className='card mb-20 w-full max-w-md p-2'
    >
      <div className='mb-2 px-3 py-2 text-center'>
        <p className='text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Verset {ayah.numberInSurah}</p>
      </div>
      <button onClick={onPlayOnce} className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-ivory-50 hover:bg-white/[0.04]'>
        <Play className='h-4 w-4 text-gold-300' />
        Jouer une fois
      </button>
      <button onClick={() => onRepeat(3)} className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-ivory-50 hover:bg-white/[0.04]'>
        <Repeat className='h-4 w-4 text-gold-300' />
        Répéter ×3
      </button>
      <button onClick={() => onRepeat(7)} className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-ivory-50 hover:bg-white/[0.04]'>
        <Repeat className='h-4 w-4 text-gold-300' />
        Répéter ×7
      </button>
      <div className='my-1 h-px bg-white/5' />
      <button onClick={onSetRangeStart} className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-ivory-50 hover:bg-white/[0.04]'>
        <span className='text-xs text-gold-300'>↓ De</span>
        Définir comme verset de départ
      </button>
      <button onClick={onSetRangeEnd} className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-ivory-50 hover:bg-white/[0.04]'>
        <span className='text-xs text-gold-300'>↑ À</span>
        Définir comme verset de fin
      </button>
      <button onClick={onClose} className='mt-1 w-full rounded-2xl py-3 text-center text-xs text-ivory-100/50 hover:bg-white/[0.02]'>
        Annuler
      </button>
    </motion.div>
  </motion.div>
)

const ReciterPicker = ({
  current,
  onSelect,
  onClose,
}: {
  current: string
  onSelect: (id: string) => void
  onClose: () => void
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className='fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 backdrop-blur-sm'
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      exit={{ y: 60 }}
      onClick={e => e.stopPropagation()}
      className='card max-h-[80vh] w-full max-w-md overflow-y-auto p-3'
    >
      <header className='mb-3 flex items-center justify-between px-2'>
        <h2 className='font-serif text-lg text-ivory-50'>Récitateur</h2>
        <button onClick={onClose} className='btn-ghost p-2'>
          <X className='h-4 w-4' />
        </button>
      </header>
      <ul className='space-y-1'>
        {RECITERS.map(r => {
          const active = r.id === current
          return (
            <li key={r.id}>
              <button
                onClick={() => onSelect(r.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors ${
                  active ? 'bg-gold-400/[0.08] ring-1 ring-gold-400/40' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <p className='text-sm text-ivory-50'>{r.name}</p>
                  <p className='font-arabic text-xs text-gold-300/70' dir='rtl'>{r.arabicName}</p>
                </div>
                {active && <span className='text-xs text-gold-300'>✓</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  </motion.div>
)

const RangePanel = ({
  data,
  range,
  onChange,
  onPlay,
  onClose,
}: {
  data: SurahDetail
  range: RangeState
  onChange: (r: RangeState) => void
  onPlay: () => void
  onClose: () => void
}) => {
  const max = data.arabic.length - 1
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 backdrop-blur-sm'
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        onClick={e => e.stopPropagation()}
        className='card max-h-[85vh] w-full max-w-md overflow-y-auto p-5'
      >
        <header className='mb-4 flex items-center justify-between'>
          <h2 className='font-serif text-xl text-ivory-50'>Lecture par plage</h2>
          <button onClick={onClose} className='btn-ghost p-2'>
            <X className='h-4 w-4' />
          </button>
        </header>

        <div className='space-y-5'>
          <NumberStepper
            label='De — verset'
            value={range.fromIdx + 1}
            min={1}
            max={range.toIdx + 1}
            onChange={v => onChange({ ...range, fromIdx: Math.min(v - 1, range.toIdx) })}
          />
          <NumberStepper
            label='À — verset'
            value={range.toIdx + 1}
            min={range.fromIdx + 1}
            max={max + 1}
            onChange={v => onChange({ ...range, toIdx: Math.max(v - 1, range.fromIdx) })}
          />

          <div className='h-px bg-white/5' />

          <NumberStepper
            label='Répéter chaque verset'
            value={range.repeatPerAyah}
            min={1}
            max={50}
            onChange={v => onChange({ ...range, repeatPerAyah: v })}
            suffix='×'
          />

          <RangeRepeatStepper
            value={range.repeatRange}
            onChange={v => onChange({ ...range, repeatRange: v })}
          />
        </div>

        <button onClick={onPlay} className='btn-primary mt-6 w-full justify-center py-3 text-sm'>
          <Play className='h-4 w-4' />
          Lancer la lecture
        </button>
        <p className='mt-3 text-center text-[11px] text-ivory-100/50'>
          {range.toIdx - range.fromIdx + 1} verset{range.toIdx > range.fromIdx ? 's' : ''} ·
          {range.repeatPerAyah > 1 ? ` chaque répété ${range.repeatPerAyah}× ·` : ''}
          {range.repeatRange < 0 ? ' boucle infinie' : ` plage ${range.repeatRange}×`}
        </p>
      </motion.div>
    </motion.div>
  )
}

const NumberStepper = ({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) => (
  <div>
    <label className='mb-2 block text-xs uppercase tracking-widest text-ivory-100/60'>{label}</label>
    <div className='flex items-center justify-between rounded-2xl bg-white/[0.03] px-2 py-2'>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className='h-9 w-9 rounded-full text-ivory-50 hover:bg-white/[0.05]'
        disabled={value <= min}
      >
        −
      </button>
      <span className='font-serif text-2xl tabular-nums text-gold-200'>
        {value}
        {suffix}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className='h-9 w-9 rounded-full text-ivory-50 hover:bg-white/[0.05]'
        disabled={value >= max}
      >
        +
      </button>
    </div>
  </div>
)

const RangeRepeatStepper = ({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) => {
  const isInfinite = value < 0
  return (
    <div>
      <label className='mb-2 block text-xs uppercase tracking-widest text-ivory-100/60'>
        Répéter la plage
      </label>
      <div className='flex items-center justify-between rounded-2xl bg-white/[0.03] px-2 py-2'>
        <button
          onClick={() => onChange(isInfinite ? 1 : Math.max(1, value - 1))}
          className='h-9 w-9 rounded-full text-ivory-50 hover:bg-white/[0.05]'
        >
          −
        </button>
        <button
          onClick={() => onChange(isInfinite ? 1 : -1)}
          className='font-serif text-2xl tabular-nums text-gold-200'
        >
          {isInfinite ? '∞' : `${value}×`}
        </button>
        <button
          onClick={() => onChange(isInfinite ? 1 : value + 1)}
          className='h-9 w-9 rounded-full text-ivory-50 hover:bg-white/[0.05]'
        >
          +
        </button>
      </div>
    </div>
  )
}
