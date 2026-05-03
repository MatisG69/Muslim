'use client'

import { motion } from 'framer-motion'

type Props = {
  qiblaBearing: number
  deviceHeading: number | null
  size?: number
  showLabels?: boolean
}

export const QiblaCompass = ({ qiblaBearing, deviceHeading, size = 280, showLabels = true }: Props) => {
  const heading = deviceHeading ?? 0
  const dialRotation = -heading
  const qiblaArrowAngle = qiblaBearing - heading
  const angleDelta = ((qiblaArrowAngle + 540) % 360) - 180
  const aligned = Math.abs(angleDelta) < 7

  return (
    <div className='relative inline-flex items-center justify-center'>
      <svg
        viewBox='0 0 200 200'
        width={size}
        height={size}
        className='select-none'
      >
        <defs>
          <radialGradient id='compass-bg' cx='50%' cy='50%' r='50%'>
            <stop offset='0%' stopColor='#1a2620' />
            <stop offset='80%' stopColor='#0a1410' />
            <stop offset='100%' stopColor='#000' />
          </radialGradient>
          <linearGradient id='qibla-arrow' x1='50%' y1='0%' x2='50%' y2='100%'>
            <stop offset='0%' stopColor='#f6ecd0' />
            <stop offset='100%' stopColor='#d4a957' />
          </linearGradient>
        </defs>

        <circle cx='100' cy='100' r='95' fill='url(#compass-bg)' stroke='rgba(212,169,87,0.4)' strokeWidth='1' />

        <motion.g
          animate={{ rotate: dialRotation }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ transformOrigin: '100px 100px' }}
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = i * 5
            const isCardinal = angle % 90 === 0
            const isMajor = angle % 30 === 0
            const len = isCardinal ? 12 : isMajor ? 8 : 4
            return (
              <line
                key={i}
                x1='100'
                y1='10'
                x2='100'
                y2={10 + len}
                stroke={isCardinal ? '#d4a957' : 'rgba(245, 239, 230, 0.4)'}
                strokeWidth={isCardinal ? 1.5 : 0.7}
                transform={`rotate(${angle} 100 100)`}
              />
            )
          })}

          {showLabels && (
            <>
              <text x='100' y='32' textAnchor='middle' fontSize='10' fill='#d4a957' fontWeight='bold'>N</text>
              <text x='168' y='104' textAnchor='middle' fontSize='9' fill='rgba(245,239,230,0.5)'>E</text>
              <text x='100' y='178' textAnchor='middle' fontSize='9' fill='rgba(245,239,230,0.5)'>S</text>
              <text x='32' y='104' textAnchor='middle' fontSize='9' fill='rgba(245,239,230,0.5)'>O</text>
            </>
          )}

          <motion.g
            animate={{ rotate: qiblaBearing }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <path
              d='M 100 22 L 105 38 L 100 33 L 95 38 Z'
              fill='url(#qibla-arrow)'
              stroke='#d4a957'
              strokeWidth='0.5'
            />
            <line x1='100' y1='38' x2='100' y2='100' stroke='url(#qibla-arrow)' strokeWidth='1.5' opacity='0.4' />
          </motion.g>
        </motion.g>

        <circle cx='100' cy='100' r='28' fill='#0a1410' stroke='rgba(212,169,87,0.6)' strokeWidth='1' />
        <text
          x='100'
          y='98'
          textAnchor='middle'
          fontSize='14'
          fill={aligned ? '#34d399' : '#d4a957'}
          fontFamily='serif'
        >
          ﷽
        </text>
        <text x='100' y='112' textAnchor='middle' fontSize='6' fill='rgba(245,239,230,0.5)' letterSpacing='1'>
          QIBLA
        </text>

        <line
          x1='100'
          y1='5'
          x2='100'
          y2='15'
          stroke={aligned ? '#34d399' : '#f87171'}
          strokeWidth='2'
          strokeLinecap='round'
        />
      </svg>

      {deviceHeading == null && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/40 backdrop-blur-sm'>
          <p className='max-w-[60%] text-center text-xs text-ivory-100/70'>
            Activez la boussole pour aligner
          </p>
        </div>
      )}
    </div>
  )
}
