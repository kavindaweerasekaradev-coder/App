import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_LOCATION_ID } from '@/data/places'
import { getModel } from '@/data/vehicles'
import type { ChargingPrefs, ConnectorType, NotificationPrefs, SessionRecord, Vehicle } from '@/data/types'
import { CHARGING_LOSS, chargingPowerAt } from '@/lib/charging'

export type ThemePref = 'light' | 'dark' | 'system'

export interface ChargingSession {
  id: string
  stationId: string | 'home'
  locationName: string
  connectorType: ConnectorType
  peakKw: number
  dc: boolean
  pricePerKwh: number
  sessionFee: number
  startPct: number
  pct: number
  targetPct: number
  kWh: number
  elapsedMin: number
  currentKw: number
  /** Simulated minutes advanced per real second. */
  speed: number
  status: 'charging' | 'complete' | 'stopped'
  powerTrace: { t: number; kw: number }[]
}

export interface SavedJourney {
  id: string
  fromId: string
  toId: string
  label: string
}

interface PersistedState {
  onboarded: boolean
  theme: ThemePref
  vehicle: Vehicle
  prefs: ChargingPrefs
  locationId: string
  locationMode: 'simulated' | 'manual'
  savedStationIds: string[]
  notifications: NotificationPrefs
  simulateErrors: boolean
  session: ChargingSession | null
  completedSessions: SessionRecord[]
  recentJourneys: SavedJourney[]
}

const STORAGE_KEY = 'velora:state'

export const DEFAULT_STATE: PersistedState = {
  onboarded: false,
  theme: 'system',
  vehicle: {
    ownerName: '',
    nickname: '',
    modelId: 'aurora-e5',
    color: 'graphite',
    plate: '',
    batteryPct: 68,
    odometerKm: 18_420,
  },
  prefs: {
    targetPct: 80,
    reservePct: 15,
    homeCharging: true,
    homeTariff: 45,
    homeStartTime: '22:30',
    preferFastCharging: true,
  },
  locationId: DEFAULT_LOCATION_ID,
  locationMode: 'simulated',
  savedStationIds: ['vl-kollupitiya', 'vl-kottawa'],
  notifications: {
    chargeComplete: true,
    chargeReminder: true,
    lowBattery: true,
    tripTips: false,
    weeklySummary: true,
  },
  simulateErrors: false,
  session: null,
  completedSessions: [],
  recentJourneys: [],
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      vehicle: { ...DEFAULT_STATE.vehicle, ...parsed.vehicle },
      prefs: { ...DEFAULT_STATE.prefs, ...parsed.prefs },
      notifications: { ...DEFAULT_STATE.notifications, ...parsed.notifications },
    }
  } catch {
    return DEFAULT_STATE
  }
}

type Updater<T> = Partial<T> | ((prev: T) => Partial<T>)

interface AppStateValue extends PersistedState {
  resolvedTheme: 'light' | 'dark'
  update: (patch: Updater<PersistedState>) => void
  setVehicle: (patch: Partial<Vehicle>) => void
  setPrefs: (patch: Partial<ChargingPrefs>) => void
  toggleSaved: (stationId: string) => void
  startSession: (s: Omit<ChargingSession, 'id' | 'pct' | 'kWh' | 'elapsedMin' | 'currentKw' | 'status' | 'powerTrace' | 'speed'>) => void
  stopSession: () => void
  dismissSession: () => void
  setSessionSpeed: (speed: number) => void
  resetAll: () => void
}

const Ctx = createContext<AppStateValue | null>(null)

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load)
  const [sysDark, setSysDark] = useState(systemDark)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable (private mode) — app still works in memory */
    }
  }, [state])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const fn = () => setSysDark(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const resolvedTheme = state.theme === 'system' ? (sysDark ? 'dark' : 'light') : state.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#121413' : '#FAF8F3')
  }, [resolvedTheme])

  const update = useCallback((patch: Updater<PersistedState>) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }, [])

  // — Simulated charging session —
  const ticking = state.session?.status === 'charging'
  const modelRef = useRef(getModel(state.vehicle.modelId))
  modelRef.current = getModel(state.vehicle.modelId)

  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => {
      setState((prev) => {
        const s = prev.session
        if (!s || s.status !== 'charging') return prev
        const model = modelRef.current
        const dtMin = s.speed
        let pct = s.pct
        let kWh = s.kWh
        let remaining = dtMin
        let kw = s.currentKw
        // Integrate in small steps so the taper is smooth even at high demo speeds.
        while (remaining > 0 && pct < s.targetPct) {
          const step = Math.min(remaining, 0.5)
          kw = chargingPowerAt(pct, s.peakKw, s.dc) * (0.97 + Math.random() * 0.03)
          const stored = (kw * step) / 60
          pct = Math.min(s.targetPct, pct + (stored / model.batteryKwh) * 100)
          kWh += stored * CHARGING_LOSS
          remaining -= step
        }
        const elapsedMin = s.elapsedMin + dtMin - remaining
        const done = pct >= s.targetPct - 0.001
        const session: ChargingSession = {
          ...s,
          pct,
          kWh,
          elapsedMin,
          currentKw: done ? 0 : kw,
          status: done ? 'complete' : 'charging',
          powerTrace: [...s.powerTrace, { t: Math.round(elapsedMin), kw: +kw.toFixed(1) }].slice(-120),
        }
        if (!done) return { ...prev, session }
        return finishSession(prev, session)
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  const value = useMemo<AppStateValue>(
    () => ({
      ...state,
      resolvedTheme,
      update,
      setVehicle: (patch) => update((p) => ({ vehicle: { ...p.vehicle, ...patch } })),
      setPrefs: (patch) => update((p) => ({ prefs: { ...p.prefs, ...patch } })),
      toggleSaved: (id) =>
        update((p) => ({
          savedStationIds: p.savedStationIds.includes(id) ? p.savedStationIds.filter((x) => x !== id) : [...p.savedStationIds, id],
        })),
      startSession: (s) =>
        update({
          session: {
            ...s,
            id: `s-${Date.now()}`,
            pct: s.startPct,
            kWh: 0,
            elapsedMin: 0,
            currentKw: chargingPowerAt(s.startPct, s.peakKw, s.dc),
            status: 'charging',
            speed: s.dc ? 1 : 5,
            powerTrace: [{ t: 0, kw: chargingPowerAt(s.startPct, s.peakKw, s.dc) }],
          },
        }),
      stopSession: () => setState((prev) => (prev.session ? finishSession(prev, { ...prev.session, status: 'stopped', currentKw: 0 }) : prev)),
      dismissSession: () => update({ session: null }),
      setSessionSpeed: (speed) => update((p) => (p.session ? { session: { ...p.session, speed } } : {})),
      resetAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        setState(DEFAULT_STATE)
      },
    }),
    [state, resolvedTheme, update],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Ends a session: records it in history and updates the vehicle's battery level. */
function finishSession(prev: PersistedState, session: ChargingSession): PersistedState {
  const record: SessionRecord = {
    id: session.id,
    date: new Date().toISOString(),
    location: session.locationName,
    stationId: session.stationId === 'home' ? undefined : session.stationId,
    kind: session.stationId === 'home' ? 'home' : session.dc ? 'public-dc' : 'public-ac',
    kWh: session.kWh,
    cost: session.kWh * session.pricePerKwh + session.sessionFee,
    minutes: Math.round(session.elapsedMin),
    startPct: Math.round(session.startPct),
    endPct: Math.round(session.pct),
  }
  return {
    ...prev,
    session,
    vehicle: { ...prev.vehicle, batteryPct: Math.round(session.pct) },
    completedSessions: session.kWh > 0.05 ? [...prev.completedSessions, record] : prev.completedSessions,
  }
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}

/** Current vehicle model plus live battery % (the session's value while charging). */
export function useVehicle() {
  const { vehicle, session } = useApp()
  const model = getModel(vehicle.modelId)
  const batteryPct = session?.status === 'charging' ? session.pct : vehicle.batteryPct
  return { vehicle, model, batteryPct }
}
