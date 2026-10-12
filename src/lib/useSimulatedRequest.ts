import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '@/state/AppState'

export type RequestState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }

/**
 * Simulates a network request with latency so screens can show real loading,
 * error and retry behaviour. Nothing leaves the device. When "Simulate network
 * errors" is enabled in Settings, requests fail so the error states can be reviewed.
 */
export function useSimulatedRequest<T>(fn: () => T, deps: unknown[], latency = 650) {
  const { simulateErrors } = useApp()
  const [state, setState] = useState<RequestState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    setState({ status: 'loading' })
    const id = window.setTimeout(() => {
      if (simulateErrors) {
        setState({ status: 'error', error: new Error('We couldn’t reach the server. Check your connection and try again.') })
        return
      }
      try {
        setState({ status: 'success', data: fnRef.current() })
      } catch (e) {
        setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) })
      }
    }, latency)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, simulateErrors, latency, ...deps])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, retry }
}
