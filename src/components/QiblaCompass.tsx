'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

type Props = {
  qiblaBearing: number
  deviceHeading: number | null
  size?: number
  showLabels?: boolean
  enableHaptic?: boolean
}

const CARDINALS = [
  { angle: 0, label: 'N', major: true },
  { angle: 45, label: 'NE', major: false },
  { angle: 90, label: 'E', major: true },
  { angle: 135, label: 'SE', major: false },
  { angle: 180, label: 'S', major: true },
  { angle: 225, label: 'SO', major: false },
  { angle: 270, label: 'O', major: true },
  { angle: 315, label: 'NO', major: false },
]

export const QiblaCompass = ({
  qiblaBearing,
  deviceHeading,
  size = 280,
  showLabels = true,
  enableHaptic = true,
}: Props) => {
  const heading = deviceHeading ?? 0
  const dialRotation = -heading
  const angleDelta = ((qiblaBearing - heading + 540) % 360) - 180
  const aligned = Math.abs(angleDelta) < 7
  const close = !aligned && Math.abs(angleDelta) < 20
  const wasAlignedRef = useRef(false)

  useEffect(() => {
    if (!enableHaptic || deviceHeading == null) return
    if (aligned && !wasAlignedRef.current && 'vibrate' in navigator) {
      navigator.vibrate([30, 80, 40])
    }
    wasAlignedRef.current = aligned
  }, [aligned, enableHaptic, deviceHeading])

  const ringColor = aligned ? '#34d399' : close ? '#fbbf24' : '#d4a957'

  return (
    <div className='relative inline-flex flex-col items-center justify-center'>
      <div
        className={`absolute inset-0 -z-10 rounded-full transition-all duration-700 ${
          aligned
            ? 'bg-emerald-400/20 blur-3xl'
            : close
              ? 'bg-amber-400/10 blur-2xl'
              : 'bg-gold-400/[0.08] blur-2xl'
        }`}
      />

      <svg
        viewBox='0 0 220 220'
        width={size}
        height={size}
        className='select-none drop-shadow-[0_24px_60px_rgba(0,0,0,0.6)]'
      >
        <defs>
          <radialGradient id='qbl-bg' cx='50%' cy='50%' r='50%'>
            <stop offset='0%' stopColor='#16241e' />
            <stop offset='70%' stopColor='#0a1410' />
            <stop offset='100%' stopColor='#000' />
          </radialGradient>
          <linearGradient id='qbl-arrow' x1='50%' y1='0%' x2='50%' y2='100%'>
            <stop offset='0%' stopColor='#fef3c7' />
            <stop offset='50%' stopColor='#f6ecd0' />
            <stop offset='100%' stopColor='#d4a957' />
          </linearGradient>
          <linearGradient id='qbl-arrow-green' x1='50%' y1='0%' x2='50%' y2='100%'>
            <stop offset='0%' stopColor='#a7f3d0' />
            <stop offset='100%' stopColor='#10b981' />
          </linearGradient>
          <radialGradient id='qbl-glow' cx='50%' cy='50%' r='50%'>
            <stop offset='0%' stopColor={ringColor} stopOpacity='0.5' />
            <stop offset='100%' stopColor={ringColor} stopOpacity='0' />
          </radialGradient>
          <filter id='qbl-glow-filter'>
            <feGaussianBlur stdDeviation='2' />
          </filter>
        </defs>

        <circle cx='110' cy='110' r='108' fill='url(#qbl-bg)' />

        <circle
          cx='110'
          cy='110'
          r='106'
          fill='none'
          stroke={ringColor}
          strokeWidth='1.5'
          opacity={aligned ? 0.9 : 0.5}
        />
        <circle cx='110' cy='110' r='102' fill='none' stroke='rgba(245,239,230,0.06)' strokeWidth='0.5' />

        {aligned && (
          <circle cx='110' cy='110' r='95' fill='url(#qbl-glow)' filter='url(#qbl-glow-filter)' />
        )}

        <motion.g
          animate={{ rotate: dialRotation }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          style={{ transformOrigin: '110px 110px' }}
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = i * 5
            const isCardinal = angle % 90 === 0
            const isMajor = angle % 30 === 0
            const len = isCardinal ? 14 : isMajor ? 8 : 4
            const stroke = isCardinal
              ? '#d4a957'
              : isMajor
                ? 'rgba(212,169,87,0.6)'
                : 'rgba(245,239,230,0.35)'
            return (
              <line
                key={i}
                x1='110'
                y1='10'
                x2='110'
                y2={10 + len}
                stroke={stroke}
                strokeWidth={isCardinal ? 1.8 : isMajor ? 1 : 0.6}
                transform={`rotate(${angle} 110 110)`}
              />
            )
          })}

          {showLabels &&
            CARDINALS.map(c => {
              const rad = (c.angle - 90) * (Math.PI / 180)
              const r = 88
              const x = 110 + r * Math.cos(rad)
              const y = 110 + r * Math.sin(rad) + 3
              const isN = c.label === 'N'
              return (
                <text
                  key={c.label}
                  x={x}
                  y={y}
                  textAnchor='middle'
                  fontSize={c.major ? (isN ? 13 : 11) : 8}
                  fill={isN ? '#d4a957' : c.major ? 'rgba(245,239,230,0.7)' : 'rgba(245,239,230,0.35)'}
                  fontWeight={isN ? 'bold' : 'normal'}
                  fontFamily='serif'
                >
                  {c.label}
                </text>
              )
            })}

          <motion.g
            animate={{ rotate: qiblaBearing }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            style={{ transformOrigin: '110px 110px' }}
          >
            <line
              x1='110'
              y1='110'
              x2='110'
              y2='42'
              stroke={aligned ? '#34d399' : '#d4a957'}
              strokeWidth='0.8'
              opacity='0.35'
            />
            <path
              d='M 110 24 L 117 44 L 110 38 L 103 44 Z'
              fill={aligned ? 'url(#qbl-arrow-green)' : 'url(#qbl-arrow)'}
              stroke={aligned ? '#34d399' : '#d4a957'}
              strokeWidth='0.5'
            />
            <g transform='translate(110, 18)'>
              <rect x='-7' y='-12' width='14' height='14' rx='1' fill='#1a1a1a' stroke={aligned ? '#34d399' : '#d4a957'} strokeWidth='0.6' />
              <rect x='-5' y='-10' width='10' height='10' fill='none' stroke={aligned ? '#34d399' : '#d4a957'} strokeWidth='0.4' />
              <text x='0' y='-3' textAnchor='middle' fontSize='4' fill={aligned ? '#34d399' : '#d4a957'}>الكعبة</text>
            </g>
          </motion.g>
        </motion.g>

        <circle cx='110' cy='110' r='32' fill='#0a1410' />
        <circle cx='110' cy='110' r='32' fill='none' stroke={ringColor} strokeWidth='1' opacity='0.7' />
        <circle cx='110' cy='110' r='28' fill='none' stroke='rgba(212,169,87,0.2)' strokeWidth='0.5' />

        <text
          x='110'
          y='106'
          textAnchor='middle'
          fontSize='16'
          fill={aligned ? '#34d399' : '#d4a957'}
          fontFamily='serif'
        >
          ﷽
        </text>
        <text
          x='110'
          y='120'
          textAnchor='middle'
          fontSize='6'
          fill='rgba(245,239,230,0.45)'
          letterSpacing='1.5'
        >
          QIBLA
        </text>

        <line
          x1='110'
          y1='2'
          x2='110'
          y2='14'
          stroke={aligned ? '#34d399' : close ? '#fbbf24' : '#f87171'}
          strokeWidth='3'
          strokeLinecap='round'
        />
        <circle cx='110' cy='2' r='2.5' fill={aligned ? '#34d399' : close ? '#fbbf24' : '#f87171'} />
      </svg>

      {deviceHeading == null && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/55 backdrop-blur-md'>
          <div className='flex flex-col items-center gap-2 px-6 text-center'>
            <p className='font-arabic text-2xl text-gold-300'>﷽</p>
            <p className='text-xs text-ivory-100/85'>Activez la boussole</p>
          </div>
        </div>
      )}
    </div>
  )
}
