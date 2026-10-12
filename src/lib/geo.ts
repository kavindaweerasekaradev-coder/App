export interface LatLng {
  lat: number
  lng: number
}

const R = 6371

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Straight-line distance is shorter than the road; this factor approximates the detour. */
export const ROAD_FACTOR = 1.3

export function roadKm(a: LatLng, b: LatLng): number {
  return haversineKm(a, b) * ROAD_FACTOR
}

/** Local planar projection in km around a reference latitude (good enough for Sri Lanka's size). */
const REF_LAT = 7.8
const KM_PER_DEG_LAT = 110.57
const KM_PER_DEG_LNG = 111.32 * Math.cos((REF_LAT * Math.PI) / 180)

export function project(p: LatLng): { x: number; y: number } {
  return { x: p.lng * KM_PER_DEG_LNG, y: -p.lat * KM_PER_DEG_LAT }
}

export function unproject(x: number, y: number): LatLng {
  return { lng: x / KM_PER_DEG_LNG, lat: -y / KM_PER_DEG_LAT }
}

/** Position of p along segment a→b (0..1) and its perpendicular distance in km. */
export function alongSegment(a: LatLng, b: LatLng, p: LatLng): { t: number; offKm: number } {
  const A = project(a)
  const B = project(b)
  const P = project(p)
  const dx = B.x - A.x
  const dy = B.y - A.y
  const len2 = dx * dx + dy * dy || 1
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2
  const tc = Math.min(1, Math.max(0, t))
  const cx = A.x + tc * dx
  const cy = A.y + tc * dy
  return { t, offKm: Math.hypot(P.x - cx, P.y - cy) }
}
