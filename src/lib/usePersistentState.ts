import { useEffect, useState } from 'react'

/** State that survives navigating away and back within the same tab (sessionStorage). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? { ...initial, ...JSON.parse(raw) } : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  }, [key, value])
  return [value, setValue] as const
}
