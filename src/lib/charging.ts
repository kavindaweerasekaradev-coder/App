import type { Connector, ConnectorType, Station, VehicleModel } from '@/data/types'

/** Grid-to-battery losses. Billed energy is a little higher than energy stored. */
export const CHARGING_LOSS = 1.07

export const isDc = (type: ConnectorType) => type !== 'Type 2'

export function estimatedRangeKm(model: VehicleModel, pct: number): number {
  return ((model.batteryKwh * pct) / 100 / model.efficiency) * 100
}

/** Power the vehicle can actually draw from a connector. */
export function effectivePowerKw(connector: Pick<Connector, 'type' | 'powerKw'>, model: VehicleModel): number {
  const vehicleCap = isDc(connector.type) ? model.maxDcKw : model.maxAcKw
  return Math.min(connector.powerKw, vehicleCap)
}

/**
 * Simplified charging curve: DC charging tapers above 50% and more steeply above 80%.
 * AC charging is roughly flat. Illustrative only.
 */
export function chargingPowerAt(pct: number, peakKw: number, dc: boolean): number {
  if (!dc) return pct < 95 ? peakKw : peakKw * 0.6
  if (pct < 50) return peakKw
  if (pct < 80) return peakKw * (1 - ((pct - 50) / 30) * 0.5)
  return peakKw * (0.5 - ((pct - 80) / 20) * 0.3)
}

export interface ChargeEstimate {
  kWh: number
  minutes: number
  cost: number
}

export function estimateCharge(opts: {
  fromPct: number
  toPct: number
  model: VehicleModel
  peakKw: number
  dc: boolean
  pricePerKwh: number
  sessionFee?: number
}): ChargeEstimate {
  const { fromPct, toPct, model, peakKw, dc, pricePerKwh, sessionFee = 0 } = opts
  if (toPct <= fromPct || peakKw <= 0) return { kWh: 0, minutes: 0, cost: 0 }
  let minutes = 0
  const stepKwh = model.batteryKwh / 100
  for (let p = fromPct; p < toPct; p += 1) {
    const portion = Math.min(1, toPct - p)
    minutes += ((stepKwh * portion) / chargingPowerAt(p, peakKw, dc)) * 60
  }
  const kWh = ((toPct - fromPct) / 100) * model.batteryKwh * CHARGING_LOSS
  return { kWh, minutes: minutes + (dc ? 3 : 1), cost: kWh * pricePerKwh + sessionFee }
}

// — Station helpers —

export const stationMaxKw = (s: Station) => Math.max(...s.connectors.map((c) => c.powerKw))
export const stationAvailable = (s: Station) => (s.status === 'offline' ? 0 : s.connectors.reduce((n, c) => n + c.available, 0))
export const stationTotal = (s: Station) => s.connectors.reduce((n, c) => n + c.total, 0)
export const stationMinPrice = (s: Station) => Math.min(...s.connectors.map((c) => c.pricePerKwh))
export const stationHasDc = (s: Station, minKw = 50) => s.connectors.some((c) => isDc(c.type) && c.powerKw >= minKw)

export function compatibleConnectors(s: Station, model: VehicleModel): Connector[] {
  return s.connectors.filter((c) => model.connectors.includes(c.type))
}

export function isCompatible(s: Station, model: VehicleModel) {
  return compatibleConnectors(s, model).length > 0
}

export type Availability = 'available' | 'busy' | 'offline'

export function availabilityOf(s: Station): Availability {
  if (s.status === 'offline') return 'offline'
  return stationAvailable(s) > 0 ? 'available' : 'busy'
}

/** Best connector this vehicle can use at a station (fastest effective power, then cheapest). */
export function bestConnector(s: Station, model: VehicleModel): Connector | undefined {
  return [...compatibleConnectors(s, model)].sort((a, b) => effectivePowerKw(b, model) - effectivePowerKw(a, model) || a.pricePerKwh - b.pricePerKwh)[0]
}
