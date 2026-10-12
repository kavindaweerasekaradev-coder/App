import { EXPRESSWAYS, HIGHWAYS, type Coord } from '@/data/mapGeometry'
import { haversineKm, type LatLng } from './geo'

/*
 * A tiny road graph built from the simplified map geometry, so journey plans
 * follow the roads drawn on the simulated map. It is illustrative only —
 * no turn restrictions, traffic or real road data.
 */

interface GraphNode extends LatLng {
  id: number
}
interface Edge {
  to: number
  km: number
  minutes: number
}

/** Simplified polylines are straighter than real roads. */
const CURVE = 1.15
const SNAP_KM = 1.2
const SPEED = { highway: 45, expressway: 85, access: 30 }

let graph: { nodes: GraphNode[]; adj: Edge[][] } | null = null

function build() {
  const nodes: GraphNode[] = []
  const adj: Edge[][] = []
  const nodeFor = ([lng, lat]: Coord) => {
    const found = nodes.find((n) => haversineKm(n, { lat, lng }) < SNAP_KM)
    if (found) return found.id
    nodes.push({ id: nodes.length, lat, lng })
    adj.push([])
    return nodes.length - 1
  }
  const addLine = (line: Coord[], speed: number) => {
    for (let i = 1; i < line.length; i++) {
      const a = nodeFor(line[i - 1])
      const b = nodeFor(line[i])
      if (a === b) continue
      const km = haversineKm(nodes[a], nodes[b]) * CURVE
      const minutes = (km / speed) * 60
      adj[a].push({ to: b, km, minutes })
      adj[b].push({ to: a, km, minutes })
    }
  }
  HIGHWAYS.forEach((l) => addLine(l, SPEED.highway))
  EXPRESSWAYS.forEach((l) => addLine(l, SPEED.expressway))
  return { nodes, adj }
}

function access(p: LatLng, n: LatLng) {
  const km = haversineKm(p, n) * 1.3
  return { km, minutes: (km / SPEED.access) * 60 }
}

export interface RoadRoute {
  path: LatLng[]
  km: number
  minutes: number
}

/** Fastest route over the simulated road graph, or a direct estimate for short trips. */
export function routeBetween(a: LatLng, b: LatLng): RoadRoute {
  const direct = haversineKm(a, b)
  const directRoute: RoadRoute = { path: [a, b], km: direct * 1.3, minutes: ((direct * 1.3) / SPEED.access) * 60 }
  if (direct < 25) return directRoute

  graph ??= build()
  const { nodes, adj } = graph
  const nearest = (p: LatLng) =>
    [...nodes]
      .sort((x, y) => haversineKm(p, x) - haversineKm(p, y))
      .slice(0, 3)
      .filter((n) => haversineKm(p, n) < 60)

  const time = new Array(nodes.length).fill(Infinity)
  const km = new Array(nodes.length).fill(Infinity)
  const prev = new Array<number>(nodes.length).fill(-1)
  const done = new Array(nodes.length).fill(false)
  for (const n of nearest(a)) {
    const acc = access(a, n)
    time[n.id] = acc.minutes
    km[n.id] = acc.km
  }

  for (;;) {
    let u = -1
    for (let i = 0; i < nodes.length; i++) if (!done[i] && time[i] < Infinity && (u < 0 || time[i] < time[u])) u = i
    if (u < 0) break
    done[u] = true
    for (const e of adj[u]) {
      if (time[u] + e.minutes < time[e.to]) {
        time[e.to] = time[u] + e.minutes
        km[e.to] = km[u] + e.km
        prev[e.to] = u
      }
    }
  }

  let best: { id: number; minutes: number; km: number } | null = null
  for (const n of nearest(b)) {
    if (time[n.id] === Infinity) continue
    const acc = access(n, b)
    const total = time[n.id] + acc.minutes
    if (!best || total < best.minutes) best = { id: n.id, minutes: total, km: km[n.id] + acc.km }
  }
  if (!best) return directRoute

  const chain: LatLng[] = []
  for (let i = best.id; i >= 0; i = prev[i]) chain.unshift({ lat: nodes[i].lat, lng: nodes[i].lng })
  return { path: [a, ...chain, b], km: best.km, minutes: best.minutes }
}
