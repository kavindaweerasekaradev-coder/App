import { useMemo } from 'react'
import { useApp, useVehicle } from '@/state/AppState'
import { getPlace, DEFAULT_LOCATION_ID } from '@/data/places'
import { generateSessions, generateUsage } from '@/data/history'
import type { SessionRecord } from '@/data/types'

export function useUserLocation() {
  const { locationId } = useApp()
  return getPlace(locationId) ?? getPlace(DEFAULT_LOCATION_ID)!
}

/** Sample history plus any sessions completed in this demo, newest first. */
export function useChargingHistory(): SessionRecord[] {
  const { completedSessions, prefs } = useApp()
  const { model } = useVehicle()
  const sample = useMemo(() => generateSessions(model, Number.isFinite(prefs.homeTariff) ? prefs.homeTariff : 45), [model, prefs.homeTariff])
  return useMemo(() => [...sample, ...completedSessions].sort((a, b) => b.date.localeCompare(a.date)), [sample, completedSessions])
}

export function useUsage() {
  const { model } = useVehicle()
  return useMemo(() => generateUsage(model), [model])
}
