import { CHARGING_LOSS } from '@/lib/charging'
import { STATIONS } from './stations'
import type { SessionRecord, VehicleModel } from './types'

/*
 * Deterministic sample driving & charging history, generated relative to today
 * so the app always looks "current". This is illustrative data, not telemetry.
 */

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface DayUsage {
  date: string
  km: number
  kWh: number
}

const DAY = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function generateUsage(model: VehicleModel, days = 184, now = new Date()): DayUsage[] {
  const rand = rng(42)
  const today = startOfDay(now).getTime()
  const out: DayUsage[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today - i * DAY)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    let km = weekend ? (rand() < 0.25 ? 110 + rand() * 120 : rand() * 30) : 22 + rand() * 34
    if (rand() < 0.06) km = 0
    // Traffic-heavy weekday driving is a little less efficient than open-road weekend trips.
    const factor = weekend ? 0.92 + rand() * 0.1 : 1.0 + rand() * 0.12
    out.push({ date: date.toISOString(), km: Math.round(km), kWh: +((km * model.efficiency * factor) / 100).toFixed(1) })
  }
  return out
}

const PUBLIC_DC = ['vl-kollupitiya', 'ev-battaramulla', 'vl-kottawa', 'vl-portcity', 'lc-kelaniya', 'gp-welipenna']
const PUBLIC_AC = ['lc-racecourse', 'gp-kotte', 'ev-mountlavinia']

export function generateSessions(model: VehicleModel, homeTariff: number, now = new Date()): SessionRecord[] {
  const rand = rng(7)
  const today = startOfDay(now).getTime()
  const out: SessionRecord[] = []
  for (let i = 180; i >= 1;) {
    const r = rand()
    const day = new Date(today - i * DAY)
    let rec: SessionRecord
    if (r < 0.7) {
      const startPct = Math.round(30 + rand() * 18)
      const endPct = 80
      const kWh = ((endPct - startPct) / 100) * model.batteryKwh * CHARGING_LOSS
      day.setHours(22, 30)
      rec = {
        id: `h-${i}`,
        date: day.toISOString(),
        location: 'Home charger',
        kind: 'home',
        kWh,
        cost: kWh * homeTariff,
        minutes: Math.round((kWh / Math.min(7.4, model.maxAcKw)) * 60),
        startPct,
        endPct,
      }
    } else {
      const dc = r < 0.92
      const pool = dc ? PUBLIC_DC : PUBLIC_AC
      const stationId = pool[Math.floor(rand() * pool.length)]
      const station = STATIONS.find((s) => s.id === stationId)!
      const conn = station.connectors.find((c) => (dc ? c.type !== 'Type 2' : c.type === 'Type 2')) ?? station.connectors[0]
      const startPct = Math.round(18 + rand() * 25)
      const endPct = dc ? 80 : Math.round(60 + rand() * 20)
      const kWh = ((endPct - startPct) / 100) * model.batteryKwh * CHARGING_LOSS
      const kw = Math.min(conn.powerKw, dc ? model.maxDcKw : model.maxAcKw) * (dc ? 0.72 : 0.95)
      day.setHours(9 + Math.floor(rand() * 10), Math.floor(rand() * 60))
      rec = {
        id: `p-${i}`,
        date: day.toISOString(),
        location: station.name,
        stationId: station.id,
        kind: dc ? 'public-dc' : 'public-ac',
        kWh,
        cost: kWh * conn.pricePerKwh + station.sessionFee,
        minutes: Math.round((kWh / kw) * 60),
        startPct,
        endPct,
      }
    }
    out.push(rec)
    i -= 2 + Math.floor(rand() * 3)
  }
  return out.reverse()
}
