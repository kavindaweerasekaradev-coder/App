import { STATIONS } from '@/data/stations'
import type { Connector, Station, VehicleModel } from '@/data/types'
import { bestConnector, effectivePowerKw, estimateCharge, isDc } from './charging'
import { alongSegment, haversineKm, ROAD_FACTOR, type LatLng } from './geo'
import { routeBetween } from './roads'

export interface Waypoint extends LatLng {
  id: string
  name: string
  subtitle: string
  stationId?: string
}

export interface JourneyStop {
  station: Station
  connector: Connector
  peakKw: number
  routeKm: number
  arrivePct: number
  departPct: number
  chargeMinutes: number
  kWh: number
  cost: number
}

export interface JourneyPlan {
  from: Waypoint
  to: Waypoint
  startPct: number
  distanceKm: number
  /** Simplified road path for drawing on the simulated map. */
  path: LatLng[]
  driveMinutes: number
  chargeMinutes: number
  energyKwh: number
  energyPct: number
  arrivalPct: number
  stops: JourneyStop[]
  chargingCost: number
  notes: string[]
}

export type JourneyErrorCode = 'same-location' | 'below-reserve' | 'unreachable'

export class JourneyError extends Error {
  constructor(
    public code: JourneyErrorCode,
    message: string,
  ) {
    super(message)
  }
}

/** Average speed for short detours to chargers just off the route. */
const AVG_DETOUR_KMH = 30

export function planJourney(opts: { from: Waypoint; to: Waypoint; startPct: number; model: VehicleModel; reservePct: number; targetPct: number }): JourneyPlan {
  const { from, to, startPct, model, reservePct, targetPct } = opts
  const road = routeBetween(from, to)
  const distance = road.km

  if (distance < 1) throw new JourneyError('same-location', 'Your start and destination are the same place.')
  if (startPct <= reservePct)
    throw new JourneyError('below-reserve', `Your battery (${startPct}%) is at or below your ${reservePct}% arrival reserve. Charge before setting off.`)

  /** Battery % used per km for this vehicle. */
  const rate = model.efficiency / model.batteryKwh
  const corridor = road.path.length > 2 ? 8 : Math.max(8, distance * 0.08)

  // Cumulative road distance at each path vertex, scaled so it sums to the route length.
  const segKm = road.path.slice(1).map((p, i) => haversineKm(road.path[i], p))
  const scale =
    distance /
    Math.max(
      0.001,
      segKm.reduce((n, k) => n + k, 0),
    )
  const cum = segKm.reduce<number[]>((acc, k) => [...acc, acc[acc.length - 1] + k * scale], [0])

  const candidates = STATIONS.filter((s) => s.status !== 'offline' && s.id !== to.stationId)
    .map((station) => {
      const connector = bestConnector(station, model)
      let best = { routeKm: 0, offKm: Infinity }
      for (let i = 0; i < segKm.length; i++) {
        const { t, offKm } = alongSegment(road.path[i], road.path[i + 1], station)
        if (offKm < best.offKm) best = { routeKm: cum[i] + Math.min(1, Math.max(0, t)) * segKm[i] * scale, offKm }
      }
      return { station, connector, routeKm: best.routeKm, offRoad: best.offKm * ROAD_FACTOR, offKm: best.offKm }
    })
    .filter(
      (c): c is typeof c & { connector: Connector } =>
        !!c.connector && isDc(c.connector.type) && c.routeKm > distance * 0.03 && c.routeKm < distance * 0.97 && c.offKm <= corridor,
    )

  const stops: JourneyStop[] = []
  let pct = startPct
  let routePos = 0
  let extraKm = 0
  const chargeCeiling = Math.min(90, Math.max(80, targetPct))

  for (let guard = 0; guard < 8; guard++) {
    if (pct - (distance - routePos) * rate >= reservePct) break

    const reachable = candidates
      .filter((c) => c.routeKm > routePos + 5 && pct - (c.routeKm - routePos + c.offRoad) * rate >= reservePct)
      .sort((a, b) => b.routeKm - a.routeKm)

    const pick = reachable[0]
    if (!pick)
      throw new JourneyError(
        'unreachable',
        'No compatible fast charger is reachable on this route with your current charge. Try charging first or choosing a closer destination.',
      )

    const arrivePct = pct - (pick.routeKm - routePos + pick.offRoad) * rate
    const neededToFinish = (distance - pick.routeKm + pick.offRoad) * rate + reservePct + 5
    const departPct = Math.min(chargeCeiling, Math.max(Math.ceil(neededToFinish / 5) * 5, Math.ceil(arrivePct) + 10))
    const peakKw = effectivePowerKw(pick.connector, model)
    const est = estimateCharge({
      fromPct: arrivePct,
      toPct: departPct,
      model,
      peakKw,
      dc: true,
      pricePerKwh: pick.connector.pricePerKwh,
      sessionFee: pick.station.sessionFee,
    })

    stops.push({
      station: pick.station,
      connector: pick.connector,
      peakKw,
      routeKm: pick.routeKm,
      arrivePct,
      departPct,
      chargeMinutes: est.minutes,
      kWh: est.kWh,
      cost: est.cost,
    })

    pct = departPct - pick.offRoad * rate
    routePos = pick.routeKm
    extraKm += pick.offRoad * 2
  }

  const arrivalPct = pct - (distance - routePos) * rate
  const totalKm = distance + extraKm
  const energyKwh = (totalKm * model.efficiency) / 100
  const notes: string[] = []
  if (arrivalPct < reservePct + 5) notes.push('You will arrive close to your reserve. Consider a top-up on the way.')
  if (stops.length === 0 && arrivalPct >= reservePct) notes.push('No charging stop needed for this trip.')

  return {
    from,
    to,
    startPct,
    distanceKm: totalKm,
    driveMinutes: road.minutes + (extraKm / AVG_DETOUR_KMH) * 60,
    path: road.path,
    chargeMinutes: stops.reduce((n, s) => n + s.chargeMinutes, 0),
    energyKwh,
    energyPct: (energyKwh / model.batteryKwh) * 100,
    arrivalPct,
    stops,
    chargingCost: stops.reduce((n, s) => n + s.cost, 0),
    notes,
  }
}
