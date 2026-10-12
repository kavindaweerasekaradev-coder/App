import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Locate, Minus, Plus, Zap } from 'lucide-react'
import { PLACES } from '@/data/places'
import type { Station } from '@/data/types'
import { availabilityOf, stationMaxKw } from '@/lib/charging'
import { clamp, cx } from '@/lib/format'
import { project, type LatLng } from '@/lib/geo'
import { COASTLINE, EXPRESSWAYS, HIGHWAYS, LOCAL_LABELS, LOCAL_ROADS, PARKS, RIVERS, URBAN, WATER, type Coord } from '@/data/mapGeometry'

const MIN_SCALE = 0.25 // px per km
const MAX_SCALE = 240

interface View {
  x: number
  y: number
  scale: number
}

export interface MapFocus extends LatLng {
  scale?: number
}

const toPath = (coords: Coord[], close = false) =>
  coords
    .map(([lng, lat], i) => {
      const p = project({ lat, lng })
      return `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`
    })
    .join(' ') + (close ? ' Z' : '')

// Static geometry is projected once.
const GEO = {
  coast: toPath(COASTLINE, true),
  water: WATER.map((w) => toPath(w, true)),
  rivers: RIVERS.map((r) => toPath(r)),
  parks: PARKS.map((p) => toPath(p, true)),
  urban: toPath(URBAN, true),
  highways: HIGHWAYS.map((h) => toPath(h)),
  expressways: EXPRESSWAYS.map((e) => toPath(e)),
  local: LOCAL_ROADS.map((r) => toPath(r)),
}

export interface SimulatedMapProps {
  stations?: Station[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  user?: LatLng | null
  route?: LatLng[]
  routeStops?: { id: string; label: string; lat: number; lng: number; kind: 'start' | 'stop' | 'end' }[]
  /** Points to fit on mount and whenever their identity changes. */
  fit?: LatLng[]
  focus?: MapFocus | null
  initial?: MapFocus
  interactive?: boolean
  className?: string
  children?: ReactNode
  controlsClassName?: string
  labelClassName?: string
  ariaLabel?: string
}

export function SimulatedMap({
  stations = [],
  selectedId,
  onSelect,
  user,
  route,
  routeStops,
  fit,
  focus,
  initial,
  interactive = true,
  className,
  children,
  controlsClassName,
  labelClassName = 'bottom-2',
  ariaLabel = 'Simulated map',
}: SimulatedMapProps) {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>(() => {
    const c = project(initial ?? user ?? { lat: 6.9055, lng: 79.853 })
    return { x: c.x, y: c.y, scale: initial?.scale ?? 50 }
  })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Fit to points
  useEffect(() => {
    if (!fit || fit.length === 0 || size.w === 0) return
    const pts = fit.map(project)
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = Math.min(48, size.h * 0.12)
    const scale = clamp(Math.min((size.w - pad * 2) / Math.max(maxX - minX, 0.5), (size.h - pad * 2) / Math.max(maxY - minY, 0.5)), MIN_SCALE, 90)
    setView({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale })
  }, [fit, size.w, size.h])

  useEffect(() => {
    if (!focus) return
    const p = project(focus)
    setView((v) => ({ x: p.x, y: p.y, scale: focus.scale ?? Math.max(v.scale, 40) }))
  }, [focus])

  const toScreen = useCallback(
    (ll: LatLng) => {
      const p = project(ll)
      return { left: (p.x - view.x) * view.scale + size.w / 2, top: (p.y - view.y) * view.scale + size.h / 2 }
    },
    [view, size],
  )

  // — Interaction: drag to pan, wheel / pinch / buttons to zoom —
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const drag = useRef<{ startX: number; startY: number; view: View; moved: boolean; pinch?: { dist: number; scale: number } } | null>(null)
  const suppressClick = useRef(false)

  const zoomAt = useCallback(
    (factor: number, sx?: number, sy?: number) => {
      setView((v) => {
        const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
        const ax = sx ?? size.w / 2
        const ay = sy ?? size.h / 2
        const wx = v.x + (ax - size.w / 2) / v.scale
        const wy = v.y + (ay - size.h / 2) / v.scale
        return { scale, x: wx - (ax - size.w / 2) / scale, y: wy - (ay - size.h / 2) / scale }
      })
    },
    [size],
  )

  useEffect(() => {
    const el = ref.current
    if (!el || !interactive) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [interactive, zoomAt])

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    suppressClick.current = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      drag.current = { startX: 0, startY: 0, view, moved: true, pinch: { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale } }
    } else {
      drag.current = { startX: e.clientX, startY: e.clientY, view, moved: false }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (d.pinch && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const scale = clamp((d.pinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / d.pinch.dist, MIN_SCALE, MAX_SCALE)
      setView((v) => ({ ...v, scale }))
      return
    }
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 5) return
    if (!d.moved) {
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    suppressClick.current = true
    setView({ ...d.view, x: d.view.x - dx / d.view.scale, y: d.view.y - dy / d.view.scale })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) drag.current = null
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return
    const step = 60 / view.scale
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) {
      e.preventDefault()
      const [dx, dy] = moves[e.key]
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
    } else if (e.key === '+' || e.key === '=') zoomAt(1.4)
    else if (e.key === '-') zoomAt(1 / 1.4)
  }

  // — Layers —
  const s = view.scale
  const transform = `translate(${size.w / 2 - view.x * s} ${size.h / 2 - view.y * s}) scale(${s})`
  const detailed = s >= 10
  const pills = s >= 14

  const routePath = useMemo(() => (route && route.length > 1 ? toPath(route.map((p) => [p.lng, p.lat])) : null), [route])

  const visible = (pos: { left: number; top: number }, margin = 40) =>
    pos.left > -margin && pos.top > -margin && pos.left < size.w + margin && pos.top < size.h + margin

  const labels = useMemo(() => {
    const out: { key: string; name: string; lat: number; lng: number; strong: boolean }[] = []
    for (const p of PLACES) {
      if (p.id === 'colombo-03') continue
      if (p.major || s >= 6) out.push({ key: p.id, name: p.name, lat: p.lat, lng: p.lng, strong: !!p.major })
    }
    if (s >= 24) LOCAL_LABELS.forEach((l) => out.push({ key: l.name, ...l, strong: false }))
    return out.filter((l) => !(s >= 24 && ['Colombo Fort', 'Rajagiriya', 'Nugegoda', 'Dehiwala', 'Battaramulla'].includes(l.name)))
  }, [s])

  const orderedStations = useMemo(() => [...stations].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0)), [stations, selectedId])

  return (
    <div
      ref={ref}
      className={cx('relative isolate select-none overflow-hidden bg-map-water', interactive && 'cursor-grab touch-none active:cursor-grabbing', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={interactive ? 0 : -1}
      role="application"
      aria-roledescription="map"
      aria-label={`${ariaLabel}. Use arrow keys to pan and plus or minus to zoom.`}
    >
      {size.w > 0 && (
        <svg width={size.w} height={size.h} className="absolute inset-0" aria-hidden>
          <defs>
            <clipPath id={`land-${uid}`}>
              <path d={GEO.coast} />
            </clipPath>
            <pattern id={`blocks-${uid}`} width="0.32" height="0.26" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
              <path d="M0 0 H0.32 M0 0 V0.26" stroke="rgb(var(--map-road))" strokeWidth={0.9 / s} opacity="0.85" />
            </pattern>
          </defs>
          <g transform={transform}>
            <path d={GEO.coast} className="fill-map-land" />
            <g clipPath={`url(#land-${uid})`}>
              {detailed && <path d={GEO.urban} fill={`url(#blocks-${uid})`} />}
              {GEO.parks.map((d, i) => (
                <path key={i} d={d} className="fill-map-park" />
              ))}
            </g>
            {GEO.water.map((d, i) => (
              <path key={i} d={d} className="fill-map-water" />
            ))}
            {GEO.rivers.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                className="stroke-map-water"
                strokeWidth={s > 20 ? 4 : 2}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            ))}
            {detailed &&
              GEO.local.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  className="stroke-map-road"
                  strokeWidth={s > 40 ? 5 : 3}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            {GEO.highways.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                className="stroke-map-road"
                strokeWidth={s > 20 ? 7 : s > 4 ? 4 : 2}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {GEO.expressways.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                className="stroke-map-major"
                strokeWidth={s > 20 ? 7 : s > 4 ? 4 : 2.5}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {routePath && (
              <>
                <path
                  d={routePath}
                  fill="none"
                  stroke="rgb(var(--surface))"
                  strokeWidth={9}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={routePath}
                  fill="none"
                  stroke="rgb(var(--primary))"
                  strokeWidth={5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </g>
        </svg>
      )}

      {/* Place labels */}
      {size.w > 0 &&
        labels.map((l) => {
          const pos = toScreen(l)
          if (!visible(pos, 0)) return null
          return (
            <span
              key={l.key}
              className={cx(
                'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-ink-2 [text-shadow:0_0_3px_rgb(var(--map-land)),0_0_3px_rgb(var(--map-land)),0_0_6px_rgb(var(--map-land))]',
                l.strong ? 'text-caption font-bold' : 'text-[0.6875rem] font-semibold',
              )}
              style={pos}
              aria-hidden
            >
              {l.name}
            </span>
          )
        })}

      {/* Station markers */}
      {size.w > 0 &&
        orderedStations.map((st) => {
          const pos = toScreen(st)
          if (!visible(pos)) return null
          const a = availabilityOf(st)
          const selected = st.id === selectedId
          const common = 'absolute -translate-x-1/2 -translate-y-1/2 transition-transform'
          const label = `${st.name}, ${a === 'available' ? 'connectors available' : a === 'busy' ? 'all connectors in use' : 'offline'}, up to ${stationMaxKw(st)} kilowatts`
          const onClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (suppressClick.current) return
            onSelect?.(st.id)
          }
          if (!pills && !selected) {
            return (
              <button
                key={st.id}
                type="button"
                aria-label={label}
                onClick={onClick}
                tabIndex={interactive ? 0 : -1}
                className={cx(
                  common,
                  'h-3.5 w-3.5 rounded-full ring-2 ring-surface hover:scale-125',
                  a === 'available' ? 'bg-primary' : a === 'busy' ? 'bg-warning' : 'bg-ink-3',
                )}
                style={pos}
              />
            )
          }
          return (
            <button
              key={st.id}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={onClick}
              tabIndex={interactive ? 0 : -1}
              className={cx(
                common,
                'flex h-8 items-center gap-1 rounded-full pl-1.5 pr-2.5 text-caption font-bold shadow-float',
                selected
                  ? 'z-10 scale-110 bg-accent text-accent-fg ring-2 ring-primary'
                  : a === 'available'
                    ? 'bg-primary text-primary-fg hover:scale-105'
                    : a === 'busy'
                      ? 'bg-surface text-ink ring-1 ring-line hover:scale-105'
                      : 'bg-surface-2 text-ink-3 ring-1 ring-line',
              )}
              style={pos}
            >
              <span
                className={cx(
                  'flex h-5 w-5 items-center justify-center rounded-full',
                  selected
                    ? 'bg-primary text-accent'
                    : a === 'available'
                      ? 'bg-accent text-accent-fg'
                      : a === 'busy'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-line text-ink-3',
                )}
              >
                <Zap size={12} strokeWidth={2.6} aria-hidden />
              </span>
              <span className="tabular">{stationMaxKw(st)}</span>
            </button>
          )
        })}

      {/* Route waypoints */}
      {size.w > 0 &&
        routeStops?.map((w, i) => {
          const pos = toScreen(w)
          if (!visible(pos)) return null
          return (
            <span
              key={`${w.id}-${i}`}
              className={cx(
                'pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-bold shadow-float ring-2 ring-surface',
                w.kind === 'stop' ? 'h-7 w-7 bg-accent text-caption text-accent-fg' : 'h-5 w-5 bg-primary',
              )}
              style={pos}
              title={w.label}
            >
              {w.kind === 'stop' ? <Zap size={14} strokeWidth={2.6} aria-hidden /> : <span className="h-2 w-2 rounded-full bg-surface" />}
            </span>
          )
        })}

      {/* User location */}
      {user && size.w > 0 && (
        <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={toScreen(user)} aria-hidden>
          <span className="absolute -inset-2 animate-pulse-ring rounded-full bg-[#2F7DF6]/40" />
          <span className="relative block h-4 w-4 rounded-full bg-[#2F7DF6] ring-[3px] ring-white shadow-float" />
        </span>
      )}

      {interactive && (
        <div className={cx('absolute right-3 flex flex-col gap-2', controlsClassName ?? 'bottom-3')}>
          <div className="flex flex-col overflow-hidden rounded-full bg-surface shadow-float ring-1 ring-line">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomAt(1.6)}
              className="flex h-11 w-11 items-center justify-center text-ink hover:bg-surface-2"
            >
              <Plus size={20} aria-hidden />
            </button>
            <span className="mx-2 h-px bg-line" aria-hidden />
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomAt(1 / 1.6)}
              className="flex h-11 w-11 items-center justify-center text-ink hover:bg-surface-2"
            >
              <Minus size={20} aria-hidden />
            </button>
          </div>
          {user && (
            <button
              type="button"
              aria-label="Centre on my location"
              onClick={() => {
                const p = project(user)
                setView({ x: p.x, y: p.y, scale: 50 })
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary-ink shadow-float ring-1 ring-line hover:bg-surface-2"
            >
              <Locate size={20} aria-hidden />
            </button>
          )}
        </div>
      )}

      <span
        className={cx(
          'pointer-events-none absolute left-2 rounded-full bg-surface/90 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-2 ring-1 ring-line',
          labelClassName,
        )}
      >
        Simulated map · not for navigation
      </span>

      {children}
    </div>
  )
}
