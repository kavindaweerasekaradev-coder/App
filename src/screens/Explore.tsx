import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, List, Map as MapIcon, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useApp, useVehicle } from '@/state/AppState'
import { STATIONS } from '@/data/stations'
import type { ConnectorType, Station } from '@/data/types'
import { availabilityOf, bestConnector, isCompatible, stationHasDc, stationMaxKw, stationMinPrice } from '@/lib/charging'
import { formatKm, formatLkr } from '@/lib/format'
import { haversineKm } from '@/lib/geo'
import { useUserLocation } from '@/lib/hooks'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { usePersistentState } from '@/lib/usePersistentState'
import { useSimulatedRequest } from '@/lib/useSimulatedRequest'
import { SimulatedMap, type MapFocus } from '@/components/map/SimulatedMap'
import { AvailabilityBadge, StationCard } from '@/components/station/StationBits'
import { Button, IconButton } from '@/components/ui/Button'
import { Chip, Segmented, Switch } from '@/components/ui/forms'
import { Skeleton } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorState } from '@/components/ui/StateView'

type Sort = 'distance' | 'power' | 'price'

interface Filters {
  query: string
  availableOnly: boolean
  compatibleOnly: boolean
  connectors: ConnectorType[]
  minKw: number
  sort: Sort
  view: 'map' | 'list'
}

const DEFAULT_FILTERS: Filters = {
  query: '',
  availableOnly: false,
  compatibleOnly: true,
  connectors: [],
  minKw: 0,
  sort: 'distance',
  view: 'map',
}

const CONNECTORS: ConnectorType[] = ['CCS2', 'CHAdeMO', 'Type 2']
const POWER_STEPS = [
  { value: '0', label: 'Any' },
  { value: '22', label: '22+' },
  { value: '50', label: '50+' },
  { value: '100', label: '100+' },
  { value: '150', label: '150+' },
]

export function Explore() {
  const { model } = useVehicle()
  const { savedStationIds, toggleSaved, prefs } = useApp()
  const here = useUserLocation()
  const [f, setF] = usePersistentState<Filters>('velora:explore', DEFAULT_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const req = useSimulatedRequest(() => STATIONS, [], 700)
  const desktop = useMediaQuery('(min-width: 1024px)')

  const set = (patch: Partial<Filters>) => setF((p) => ({ ...p, ...patch }))

  const apply = (all: Station[], filters: Filters) => {
    const q = filters.query.trim().toLowerCase()
    return all
      .filter((s) => !q || [s.name, s.area, s.operator, s.address].some((x) => x.toLowerCase().includes(q)))
      .filter((s) => !filters.availableOnly || availabilityOf(s) === 'available')
      .filter((s) => !filters.compatibleOnly || isCompatible(s, model))
      .filter((s) => filters.connectors.length === 0 || s.connectors.some((c) => filters.connectors.includes(c.type)))
      .filter((s) => filters.minKw === 0 || s.connectors.some((c) => c.powerKw >= filters.minKw))
      .map((s) => ({ s, d: haversineKm(here, s) }))
      .sort((a, b) =>
        filters.sort === 'power'
          ? stationMaxKw(b.s) - stationMaxKw(a.s) || a.d - b.d
          : filters.sort === 'price'
            ? stationMinPrice(a.s) - stationMinPrice(b.s) || a.d - b.d
            : rank(a) - rank(b),
      )
  }
  /** With "Prefer fast chargers" on, DC 50 kW+ stations are ranked as if 3 km closer. */
  const rank = (r: { s: Station; d: number }) => r.d - (prefs.preferFastCharging && stationHasDc(r.s) ? 3 : 0)

  const results = useMemo(() => (req.status === 'success' ? apply(req.data, f) : []), [req.status, req.data, f, model, here, prefs.preferFastCharging]) // eslint-disable-line react-hooks/exhaustive-deps
  const fit = useMemo(() => (f.query.trim() && results.length ? results.map((r) => r.s) : undefined), [f.query, results])
  const selected = results.find((r) => r.s.id === selectedId)

  const advancedCount = f.connectors.length + (f.minKw > 0 ? 1 : 0) + (f.sort !== 'distance' ? 1 : 0)
  const activeCount = advancedCount + (f.availableOnly ? 1 : 0)
  const clearAll = () => setF((p) => ({ ...DEFAULT_FILTERS, view: p.view }))

  const selectStation = (id: string) => {
    setSelectedId(id)
    const st = STATIONS.find((s) => s.id === id)
    if (st) setFocus({ lat: st.lat, lng: st.lng })
  }

  // — Pieces —
  const searchBar = (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
      <div className="relative flex-1">
        <label htmlFor="station-search" className="sr-only">
          Search stations, areas or networks
        </label>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          id="station-search"
          type="search"
          value={f.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search stations or areas"
          autoComplete="off"
          className="h-12 w-full rounded-full bg-surface pl-11 pr-11 text-body text-ink shadow-card ring-1 ring-inset ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-primary-ink [&::-webkit-search-cancel-button]:hidden"
        />
        {f.query && (
          <button
            type="button"
            onClick={() => set({ query: '' })}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
      <span className="relative">
        <IconButton
          icon={SlidersHorizontal}
          label={`Filters${advancedCount ? `, ${advancedCount} active` : ''}`}
          onClick={() => setSheetOpen(true)}
          className="h-12 w-12 shadow-card"
        />
        {advancedCount > 0 && (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-caption font-bold text-primary-fg">
            {advancedCount}
          </span>
        )}
      </span>
    </form>
  )

  const chips = (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
      <Chip selected={f.compatibleOnly} onClick={() => set({ compatibleOnly: !f.compatibleOnly })} icon={f.compatibleOnly ? Check : undefined}>
        Fits my {model.name}
      </Chip>
      <Chip selected={f.availableOnly} onClick={() => set({ availableOnly: !f.availableOnly })}>
        Available now
      </Chip>
      <Chip selected={f.minKw >= 50} onClick={() => set({ minKw: f.minKw >= 50 ? 0 : 50 })}>
        Fast · 50 kW+
      </Chip>
      {CONNECTORS.map((c) => (
        <Chip
          key={c}
          selected={f.connectors.includes(c)}
          onClick={() => set({ connectors: f.connectors.includes(c) ? f.connectors.filter((x) => x !== c) : [...f.connectors, c] })}
        >
          {c}
        </Chip>
      ))}
    </div>
  )

  const viewToggle = (
    <Segmented
      label="View"
      value={f.view}
      onChange={(v) => set({ view: v })}
      options={[
        { value: 'map', label: 'Map', icon: MapIcon },
        { value: 'list', label: 'List', icon: List },
      ]}
      className="shadow-card ring-1 ring-line lg:hidden"
    />
  )

  const empty = (
    <EmptyState
      icon={SearchX}
      title="No stations match"
      body={f.query ? `Nothing found for “${f.query}” with these filters.` : 'Try removing a filter or two.'}
      action={
        <Button variant="secondary" onClick={clearAll}>
          Clear search & filters
        </Button>
      }
    />
  )

  const list =
    req.status === 'loading' ? (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading stations">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex gap-3 p-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-6 w-1/2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    ) : req.status === 'error' ? (
      <div className="card">
        <ErrorState title="Couldn’t load stations" message={req.error.message} onRetry={req.retry} />
      </div>
    ) : results.length === 0 ? (
      <div className="card">{empty}</div>
    ) : (
      <ul className="flex flex-col gap-3">
        {results.map(({ s, d }) => (
          <li key={s.id}>
            <StationCard
              station={s}
              model={model}
              distanceKm={d}
              saved={savedStationIds.includes(s.id)}
              onToggleSave={() => toggleSaved(s.id)}
              selected={s.id === selectedId}
              onHover={() => setSelectedId(s.id)}
            />
          </li>
        ))}
      </ul>
    )

  const resultsSummary = req.status === 'success' && (
    <p className="text-small text-ink-2" aria-live="polite">
      <span className="tabular font-semibold text-ink">{results.length}</span> station{results.length === 1 ? '' : 's'}
      {f.sort === 'distance' && prefs.preferFastCharging && ' · fast chargers prioritised'} · sample availability, not live
    </p>
  )

  const map = (
    <SimulatedMap
      stations={results.map((r) => r.s)}
      selectedId={selectedId}
      onSelect={selectStation}
      user={here}
      fit={fit}
      focus={focus}
      className="h-full w-full"
      controlsClassName={selected ? 'bottom-48 md:bottom-44 lg:bottom-3' : 'bottom-24 md:bottom-3'}
      labelClassName="top-[11.75rem] lg:top-auto lg:bottom-2"
      ariaLabel="Simulated map of charging stations"
    >
      {req.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/40" aria-hidden>
          <span className="rounded-full bg-surface px-4 py-2 text-small font-semibold shadow-float">Loading stations…</span>
        </div>
      )}
    </SimulatedMap>
  )

  return (
    <div className="lg:flex lg:h-dvh">
      {desktop ? (
        <>
          <aside className="flex w-[26rem] shrink-0 flex-col border-r border-line bg-bg">
            <div className="space-y-3 p-5 pb-3">
              <h1 className="text-headline font-bold">Find charging</h1>
              {searchBar}
              {chips}
              {resultsSummary}
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">{list}</div>
          </aside>
          <div className="relative flex-1">
            {map}
            {selected && (
              <div className="absolute left-4 top-4 w-96 animate-fade-up">
                <SelectedPreview station={selected.s} distance={selected.d} onClose={() => setSelectedId(null)} />
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          {f.view === 'list' ? (
            <div className="mx-auto max-w-3xl px-4 pb-28 sm:px-6 md:pb-10">
              <div className="sticky top-0 z-20 -mx-4 space-y-3 bg-bg/95 px-4 pb-3 pt-5 backdrop-blur sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-headline font-bold">Find charging</h1>
                  {viewToggle}
                </div>
                {searchBar}
                {chips}
                {resultsSummary}
              </div>
              {list}
            </div>
          ) : (
            <div className="relative h-dvh">
              {map}
              <div className="pointer-events-none absolute inset-x-0 top-0 space-y-3 bg-gradient-to-b from-bg/90 via-bg/60 to-transparent px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 [&>*]:pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-headline font-bold">Find charging</h1>
                  {viewToggle}
                </div>
                {searchBar}
                {chips}
              </div>

              {req.status === 'error' && (
                <div className="absolute inset-x-4 bottom-28 card md:bottom-6">
                  <ErrorState title="Couldn’t load stations" message={req.error.message} onRetry={req.retry} className="py-6" />
                </div>
              )}
              {req.status === 'success' && results.length === 0 && <div className="absolute inset-x-4 bottom-28 card md:bottom-6">{empty}</div>}
              {selected && (
                <div className="absolute inset-x-4 bottom-24 animate-fade-up md:bottom-6 md:left-auto md:w-96">
                  <SelectedPreview station={selected.s} distance={selected.d} onClose={() => setSelectedId(null)} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" onClick={clearAll}>
              Clear all
            </Button>
            <Button size="lg" block onClick={() => setSheetOpen(false)}>
              Show {results.length} station{results.length === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-2 text-small font-semibold">Connector type</legend>
            <div className="flex flex-wrap gap-2">
              {CONNECTORS.map((c) => (
                <Chip
                  key={c}
                  selected={f.connectors.includes(c)}
                  onClick={() => set({ connectors: f.connectors.includes(c) ? f.connectors.filter((x) => x !== c) : [...f.connectors, c] })}
                >
                  {c}
                  {model.connectors.includes(c) && <span className="text-caption opacity-75">· yours</span>}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="mb-2 text-small font-semibold" id="power-label">
              Minimum charging power (kW)
            </p>
            <Segmented
              label="Minimum charging power"
              value={String(f.minKw)}
              onChange={(v) => set({ minKw: Number(v) })}
              options={POWER_STEPS}
              className="w-full"
              size="sm"
            />
          </div>
          <div>
            <p className="mb-2 text-small font-semibold">Sort by</p>
            <Segmented<Sort>
              label="Sort by"
              value={f.sort}
              onChange={(v) => set({ sort: v })}
              options={[
                { value: 'distance', label: 'Distance' },
                { value: 'power', label: 'Power' },
                { value: 'price', label: 'Price' },
              ]}
              className="w-full"
            />
          </div>
          <div className="divide-y divide-line rounded bg-surface-2/50 px-4">
            <Switch
              label="Available now"
              description="Hide stations where every connector is in use (sample data)."
              checked={f.availableOnly}
              onChange={(v) => set({ availableOnly: v })}
            />
            <Switch
              label={`Compatible with my ${model.name}`}
              description={`Only show ${model.connectors.join(' or ')} connectors.`}
              checked={f.compatibleOnly}
              onChange={(v) => set({ compatibleOnly: v })}
            />
          </div>
          <p className="text-small text-ink-3">
            {activeCount > 0 ? `${activeCount} filter${activeCount === 1 ? '' : 's'} active.` : 'No extra filters active.'} DC fast charging (50 kW+) is
            available at {STATIONS.filter((s) => stationHasDc(s)).length} sample stations.
          </p>
        </div>
      </Sheet>
    </div>
  )
}

function SelectedPreview({ station, distance, onClose }: { station: Station; distance: number; onClose: () => void }) {
  const { model } = useVehicle()
  const best = bestConnector(station, model)
  return (
    <article className="card p-4 shadow-float" aria-label={`${station.name} preview`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-body font-bold">{station.name}</h2>
          <p className="tabular truncate text-small text-ink-2">
            {formatKm(distance)} · {station.area} · up to {stationMaxKw(station)} kW
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AvailabilityBadge station={station} />
          <span className="tabular text-small text-ink-2">{best ? `${formatLkr(best.pricePerKwh)}/kWh` : 'Not compatible'}</span>
        </div>
        <Link
          to={`/stations/${station.id}`}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-small font-semibold text-primary-fg hover:bg-primary/90"
        >
          Details <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </article>
  )
}
