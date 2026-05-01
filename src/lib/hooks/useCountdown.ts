'use client'

import { useEffect, useState } from 'react'

export const useCountdown = (target: Date | null): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!target) return 0
  return Math.max(0, target.getTime() - now)
}
