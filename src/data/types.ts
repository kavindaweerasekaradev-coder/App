export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type 2'

export type Amenity = 'cafe' | 'restaurant' | 'restroom' | 'wifi' | 'shopping' | 'parking' | 'lounge' | 'covered'

export interface Connector {
  type: ConnectorType
  powerKw: number
  total: number
  /** Sample availability — never live data. */
  available: number
  pricePerKwh: number
}

export type StationStatus = 'operational' | 'limited' | 'offline'

export interface Station {
  id: string
  name: string
  operator: string
  address: string
  area: string
  lat: number
  lng: number
  connectors: Connector[]
  amenities: Amenity[]
  hours: string
  rating: number
  reviews: number
  sessionFee: number
  parking: string
  status: StationStatus
  /** Minutes since the sample availability snapshot was "taken". */
  snapshotMinutes: number
}

export interface VehicleModel {
  id: string
  name: string
  maker: string
  bodyStyle: string
  batteryKwh: number
  /** Average consumption, kWh per 100 km. */
  efficiency: number
  connectors: ConnectorType[]
  maxDcKw: number
  maxAcKw: number
}

export type VehicleColor = 'graphite' | 'pearl' | 'forest' | 'sand'

export interface Vehicle {
  ownerName: string
  nickname: string
  modelId: string
  color: VehicleColor
  plate: string
  batteryPct: number
  odometerKm: number
}

export interface ChargingPrefs {
  targetPct: number
  reservePct: number
  homeCharging: boolean
  homeTariff: number
  homeStartTime: string
  preferFastCharging: boolean
}

export interface Place {
  id: string
  name: string
  subtitle: string
  lat: number
  lng: number
  /** Show the label on zoomed-out maps. */
  major?: boolean
}

export interface SessionRecord {
  id: string
  date: string
  location: string
  stationId?: string
  kind: 'home' | 'public-ac' | 'public-dc'
  kWh: number
  cost: number
  minutes: number
  startPct: number
  endPct: number
}

export interface NotificationPrefs {
  chargeComplete: boolean
  chargeReminder: boolean
  lowBattery: boolean
  tripTips: boolean
  weeklySummary: boolean
}
