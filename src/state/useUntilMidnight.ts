import { useEffect, useState } from 'react'

/** Time left until midnight, when today's deal ends. */
export function useUntilMidnight() {
  const calc = () => {
    const end = new Date()
    end.setHours(24, 0, 0, 0)
    const s = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000))
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = window.setInterval(() => setLeft(calc()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return left
}
