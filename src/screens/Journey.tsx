import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpDown, BatteryMedium, Bookmark, Clock, Flag, Gauge, Info, Pencil, Route as RouteIcon, TriangleAlert, Zap } from 'lucide-react'
import { useApp, useVehicle } from '@/state/AppState'
import { getStation } from '@/data/stations'
import { estimatedRangeKm } from '@/lib/charging'
import { useChartTheme } from '@/lib/chartTheme'
import { cx, formatDuration, formatKm, formatKw, formatLkr } from '@/lib/format'
import { useUserLocation } from '@/lib/hooks'
import { JourneyError, planJourney, type JourneyPlan } from '@/lib/journey'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { allLocationOptions, LocationInput, type LocationOption } from '@/components/forms/LocationInput'
import { SimulatedMap } from '@/components/map/SimulatedMap'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/forms'
import { Card, Notice, SectionHeader, Skeleton } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/StateView'

type Phase = { kind: 'idle' } | { kind: 'loading' } | { kind: 'result'; plan: JourneyPlan } | { kind: 'error'; error: JourneyError | Error }

const SUGGESTED = ['kandy', 'galle', 'nuwara-eliya', 'negombo', 'jaffna']

export function Journey() {
  const app = useApp()
  const { model, batteryPct } = useVehicle()
  const here = useUserLocation()
  const [params] = useSearchParams()

  const current: LocationOption = useMemo(
    () => ({ id: 'current', name: 'Current location', subtitle: `${here.name} (sample location)`, lat: here.lat, lng: here.lng, kind: 'current' }),
    [here],
  )
  const options = useMemo(() => allLocationOptions(current), [current])
  const findOption = (id: string | null) => (id ? (options.find((o) => o.id === id) ?? null) : null)

  const [from, setFrom] = useState<LocationOption | null>(current)
  const [fromText, setFromText] = useState(current.name)
  const initialTo = findOption(params.get('to'))
  const [to, setTo] = useState<LocationOption | null>(initialTo)
  const [toText, setToText] = useState(initialTo?.name ?? '')
  const [startPct, setStartPct] = useState(Math.max(5, Math.round(batteryPct)))
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({})
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [savedFlash, setSavedFlash] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const resolve = (sel: LocationOption | null, text: string) => {
    if (sel && sel.name === text) return sel
    const exact = options.find((o) => o.name.toLowerCase() === text.trim().toLowerCase())
    return exact ?? null
  }

  const run = (f: LocationOption, t: LocationOption, pct = startPct) => {
    setPhase({ kind: 'loading' })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (app.simulateErrors) {
        setPhase({ kind: 'error', error: new Error('We couldn’t reach the route service. Check your connection and try again.') })
        return
      }
      try {
        const plan = planJourney({ from: f, to: t, startPct: pct, model, reservePct: app.prefs.reservePct, targetPct: app.prefs.targetPct })
        setPhase({ kind: 'result', plan })
      } catch (e) {
        setPhase({ kind: 'error', error: e as Error })
      }
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }, 900)
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const f = resolve(from, fromText)
    const t = resolve(to, toText)
    const errs: typeof errors = {}
    if (!fromText.trim()) errs.from = 'Enter a starting point.'
    else if (!f) errs.from = 'Choose a starting point from the suggestions.'
    if (!toText.trim()) errs.to = 'Enter a destination.'
    else if (!t) errs.to = 'Choose a destination from the suggestions.'
    if (f && t && f.id === t.id) errs.to = 'Choose a destination different from your start.'
    setErrors(errs)
    if (Object.keys(errs).length || !f || !t) return
    setFrom(f)
    setTo(t)
    run(f, t)
  }

  const swap = () => {
    setFrom(to)
    setFromText(toText)
    setTo(from)
    setToText(fromText)
    setErrors({})
  }

  const pickDestination = (o: LocationOption) => {
    setTo(o)
    setToText(o.name)
    setErrors((e) => ({ ...e, to: undefined }))
  }

  const saveJourney = (plan: JourneyPlan) => {
    const id = `${plan.from.id}->${plan.to.id}`
    app.update((p) => ({
      recentJourneys: [
        { id, fromId: plan.from.id, toId: plan.to.id, label: `${plan.from.name} → ${plan.to.name}` },
        ...p.recentJourneys.filter((j) => j.id !== id),
      ].slice(0, 5),
    }))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <Page wide>
      <PageHeader
        title="Plan a journey"
        subtitle={`${model.maker} ${model.name} · ~${formatKm(estimatedRangeKm(model, startPct))} est. range at ${startPct}%`}
      />

      <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
        {/* Form */}
        <Card as="section" aria-label="Trip details" className="p-4 sm:p-5 lg:sticky lg:top-6">
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <div className="relative flex flex-col gap-2">
              <LocationInput
                label="Starting point"
                value={from}
                text={fromText}
                onText={(t) => {
                  setFromText(t)
                  setErrors((e) => ({ ...e, from: undefined }))
                }}
                onSelect={(o) => {
                  setFrom(o)
                  setFromText(o.name)
                  setErrors((e) => ({ ...e, from: undefined }))
                }}
                options={options}
                error={errors.from}
                dotClass="bg-ink-3"
                placeholder="Starting point"
              />
              <LocationInput
                label="Destination"
                value={to}
                text={toText}
                onText={(t) => {
                  setToText(t)
                  setErrors((e) => ({ ...e, to: undefined }))
                }}
                onSelect={pickDestination}
                options={options}
                error={errors.to}
                dotClass="bg-primary"
                placeholder="Where to?"
              />
              <button
                type="button"
                onClick={swap}
                aria-label="Swap start and destination"
                className="absolute right-3 top-[2.05rem] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-2 shadow-card ring-1 ring-line hover:text-ink"
              >
                <ArrowUpDown size={15} aria-hidden />
              </button>
            </div>

            {!to && !toText && (
              <div>
                <p className="mb-2 text-small font-semibold text-ink-2">{app.recentJourneys.length ? 'Recent' : 'Popular destinations'}</p>
                <div className="flex flex-wrap gap-2">
                  {(app.recentJourneys.length
                    ? app.recentJourneys.map((j) => findOption(j.toId)).filter(Boolean)
                    : SUGGESTED.map((id) => findOption(id)).filter(Boolean)
                  ).map((o) => (
                    <button
                      key={o!.id}
                      type="button"
                      onClick={() => pickDestination(o!)}
                      className="h-9 rounded-full bg-surface-2 px-3.5 text-small font-semibold text-ink hover:bg-primary-soft"
                    >
                      {o!.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Slider
              label="Battery at departure"
              value={startPct}
              min={5}
              max={100}
              onChange={setStartPct}
              hint={`Your current level is ${Math.round(batteryPct)}%. Arrival reserve: ${app.prefs.reservePct}% (change in Profile).`}
            />

            <Button type="submit" size="lg" block icon={RouteIcon} disabled={phase.kind === 'loading'}>
              {phase.kind === 'loading' ? 'Planning route…' : 'Plan route'}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div ref={resultRef} className="min-w-0 scroll-mt-4" aria-live="polite">
          {phase.kind === 'idle' && (
            <Card>
              <EmptyState
                icon={RouteIcon}
                title="Where are you heading?"
                body="Choose a destination to see distance, duration, battery use and any charging stops you’ll need."
              />
            </Card>
          )}
          {phase.kind === 'loading' && <ResultSkeleton />}
          {phase.kind === 'error' && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center" role="alert">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning">
                  <TriangleAlert size={24} aria-hidden />
                </span>
                <h2 className="text-title font-bold">{phase.error instanceof JourneyError ? 'We can’t plan this trip yet' : 'Route service unavailable'}</h2>
                <p className="mt-1 max-w-sm text-body text-ink-2">{phase.error.message}</p>
                <div className="mt-5 flex gap-2">
                  {phase.error instanceof JourneyError && phase.error.code === 'unreachable' && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStartPct(100)
                        if (from && to) run(from, to, 100)
                      }}
                    >
                      Re-plan with 100% charge
                    </Button>
                  )}
                  {!(phase.error instanceof JourneyError) && (
                    <Button variant="secondary" onClick={() => submit()}>
                      Try again
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
          {phase.kind === 'result' && <JourneyResult plan={phase.plan} onSave={() => saveJourney(phase.plan)} saved={savedFlash} />}
        </div>
      </div>
    </Page>
  )
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Planning route">
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

function JourneyResult({ plan, onSave, saved }: { plan: JourneyPlan; onSave: () => void; saved: boolean }) {
  const { prefs } = useApp()
  const c = useChartTheme()
  const fit = useMemo(() => [...plan.path, ...plan.stops.map((s) => s.station)], [plan])
  const routeStops = [
    { id: plan.from.id, label: plan.from.name, lat: plan.from.lat, lng: plan.from.lng, kind: 'start' as const },
    ...plan.stops.map((s) => ({ id: s.station.id, label: s.station.name, lat: s.station.lat, lng: s.station.lng, kind: 'stop' as const })),
    { id: plan.to.id, label: plan.to.name, lat: plan.to.lat, lng: plan.to.lng, kind: 'end' as const },
  ]

  const profile = useMemo(() => {
    const pts: { km: number; pct: number }[] = [{ km: 0, pct: plan.startPct }]
    plan.stops.forEach((s) => {
      pts.push({ km: Math.round(s.routeKm), pct: Math.round(s.arrivePct) })
      pts.push({ km: Math.round(s.routeKm) + 0.01, pct: s.departPct })
    })
    pts.push({ km: Math.round(plan.distanceKm), pct: Math.max(0, Math.round(plan.arrivalPct)) })
    return pts
  }, [plan])

  const total = plan.driveMinutes + plan.chargeMinutes
  const destStation = plan.to.stationId ? getStation(plan.to.stationId) : undefined

  return (
    <div className="flex animate-fade-up flex-col gap-5">
      <div className="overflow-hidden rounded-xl shadow-card">
        <SimulatedMap route={plan.path} routeStops={routeStops} fit={fit} className="h-72 sm:h-80" ariaLabel="Simulated route map" />
      </div>

      <div>
        <h2 className="text-headline font-bold">
          {plan.from.name} → {plan.to.name}
        </h2>
        <p className="text-small text-ink-2">
          {plan.stops.length === 0 ? 'No charging stops needed' : `${plan.stops.length} charging stop${plan.stops.length > 1 ? 's' : ''}`} · estimates only
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile icon={RouteIcon} label="Distance" value={formatKm(plan.distanceKm)} />
        <SummaryTile
          icon={Clock}
          label="Total time"
          value={formatDuration(total)}
          sub={plan.chargeMinutes ? `incl. ${formatDuration(plan.chargeMinutes)} charging` : 'driving'}
        />
        <SummaryTile icon={Gauge} label="Energy use" value={`${plan.energyKwh.toFixed(1)} kWh`} sub={`≈ ${Math.round(plan.energyPct)}% of battery`} />
        <SummaryTile
          icon={BatteryMedium}
          label="On arrival"
          value={`${Math.max(0, Math.round(plan.arrivalPct))}%`}
          sub={`reserve ${prefs.reservePct}%`}
          highlight={plan.arrivalPct < prefs.reservePct + 5 ? 'warning' : 'ok'}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeader title="Battery along the route" />
        <div className="h-44" role="img" aria-label={`Battery estimate: starts at ${plan.startPct}%, arrives at ${Math.round(plan.arrivalPct)}%.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profile} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="batt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={c.primary} stopOpacity={0.28} />
                  <stop offset="1" stopColor={c.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis
                dataKey="km"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(v) => `${Math.round(v)} km`}
                stroke={c.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <ReferenceLine
                y={prefs.reservePct}
                stroke={c.warning}
                strokeDasharray="4 4"
                label={{ value: 'Reserve', position: 'insideTopRight', fill: c.warning, fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Battery']}
                labelFormatter={(v: number) => `${Math.round(v)} km`}
                contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12, color: c.ink }}
              />
              <Area
                type="linear"
                dataKey="pct"
                stroke={c.primary}
                strokeWidth={2.5}
                fill="url(#batt)"
                dot={{ r: 3, fill: c.primary, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card as="section" aria-labelledby="itinerary" className="p-4 sm:p-5">
        <SectionHeader id="itinerary" title="Itinerary" />
        <ol className="relative">
          <TimelineItem tone="start" title={plan.from.name} meta={`Depart with ${plan.startPct}%`} />
          {plan.stops.map((s, i) => (
            <TimelineItem
              key={s.station.id}
              tone="stop"
              title={
                <Link to={`/stations/${s.station.id}`} className="hover:underline">
                  {s.station.name}
                </Link>
              }
              meta={`Stop ${i + 1} · ${formatKm(s.routeKm)} from start`}
            >
              <div className="mt-2 grid grid-cols-3 gap-2 rounded bg-surface-2 p-3 text-small">
                <div>
                  <p className="text-ink-2">Charge</p>
                  <p className="tabular font-bold">
                    {Math.round(s.arrivePct)}% → {s.departPct}%
                  </p>
                </div>
                <div>
                  <p className="text-ink-2">Time</p>
                  <p className="tabular font-bold">~{formatDuration(s.chargeMinutes)}</p>
                </div>
                <div>
                  <p className="text-ink-2">Cost</p>
                  <p className="tabular font-bold">{formatLkr(s.cost)}</p>
                </div>
              </div>
              <p className="tabular mt-1.5 text-caption text-ink-3">
                {s.connector.type} · up to {formatKw(s.peakKw)} for your car · {s.connector.available}/{s.connector.total} free in sample data
              </p>
            </TimelineItem>
          ))}
          <TimelineItem tone="end" title={plan.to.name} meta={`Arrive with ~${Math.max(0, Math.round(plan.arrivalPct))}%`} last>
            {destStation && (
              <Link to={`/stations/${destStation.id}`} className="mt-1 inline-flex text-small font-semibold text-primary-ink hover:underline">
                View station
              </Link>
            )}
          </TimelineItem>
        </ol>
        {plan.stops.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-line pt-4">
            <span className="text-body text-ink-2">Estimated charging cost</span>
            <span className="tabular text-title font-bold">{formatLkr(plan.chargingCost)}</span>
          </div>
        )}
      </Card>

      {plan.notes.map((n) => (
        <Notice key={n} icon={n.includes('close') ? TriangleAlert : Info} tone={n.includes('close') ? 'warning' : 'neutral'}>
          {n}
        </Notice>
      ))}
      <Notice icon={Info}>
        Routes use a simplified road network on a simulated map. Durations assume typical average speeds for each road type, and consumption assumes your car’s
        average efficiency. Weather, elevation and traffic will change real results.
      </Notice>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" icon={Bookmark} onClick={onSave}>
          {saved ? 'Saved to recent' : 'Save trip'}
        </Button>
        <Button variant="ghost" icon={Pencil} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Edit trip
        </Button>
      </div>
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof Clock
  label: string
  value: string
  sub?: string
  highlight?: 'ok' | 'warning'
}) {
  return (
    <div className={cx('card p-4', highlight === 'warning' && 'ring-2 ring-warning/50')}>
      <p className="flex items-center gap-1.5 text-small text-ink-2">
        <Icon size={15} className="text-ink-3" aria-hidden /> {label}
      </p>
      <p className={cx('tabular mt-1 text-title font-bold', highlight === 'warning' && 'text-warning')}>{value}</p>
      {sub && <p className="tabular text-caption text-ink-3">{sub}</p>}
    </div>
  )
}

function TimelineItem({
  tone,
  title,
  meta,
  children,
  last,
}: {
  tone: 'start' | 'stop' | 'end'
  title: React.ReactNode
  meta: string
  children?: React.ReactNode
  last?: boolean
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-1">
      {!last && <span className="absolute bottom-0 left-[15px] top-8 w-0.5 bg-line" aria-hidden />}
      <span
        className={cx(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          tone === 'stop' ? 'bg-accent text-accent-fg' : tone === 'end' ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-ink-2',
        )}
        aria-hidden
      >
        {tone === 'stop' ? <Zap size={16} /> : tone === 'end' ? <Flag size={15} /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-body font-bold">{title}</p>
        <p className="tabular text-small text-ink-2">{meta}</p>
        {children}
      </div>
    </li>
  )
}
