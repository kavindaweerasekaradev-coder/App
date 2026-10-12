import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bath,
  Bookmark,
  BookmarkCheck,
  CircleParking,
  Clock,
  Coffee,
  Info,
  MapPinOff,
  Navigation,
  Plug,
  ShoppingBag,
  Sofa,
  Star,
  TriangleAlert,
  Umbrella,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useApp, useVehicle } from '@/state/AppState'
import { AMENITY_LABEL, getStation } from '@/data/stations'
import type { Amenity, Connector, Station } from '@/data/types'
import {
  availabilityOf,
  bestConnector,
  effectivePowerKw,
  estimateCharge,
  isDc,
  stationAvailable,
  stationMaxKw,
  stationMinPrice,
  stationTotal,
} from '@/lib/charging'
import { cx, formatDuration, formatKm, formatKw, formatLkr } from '@/lib/format'
import { haversineKm } from '@/lib/geo'
import { useUserLocation } from '@/lib/hooks'
import { useSimulatedRequest } from '@/lib/useSimulatedRequest'
import { Page } from '@/components/layout/AppShell'
import { SimulatedMap } from '@/components/map/SimulatedMap'
import { AvailabilityBadge } from '@/components/station/StationBits'
import { Button, ButtonLink, IconButton } from '@/components/ui/Button'
import { Slider } from '@/components/ui/forms'
import { Badge, Card, Notice, SectionHeader, Skeleton, Stat } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorState } from '@/components/ui/StateView'

const AMENITY_ICON: Record<Amenity, LucideIcon> = {
  cafe: Coffee,
  restaurant: Utensils,
  restroom: Bath,
  wifi: Wifi,
  shopping: ShoppingBag,
  parking: CircleParking,
  lounge: Sofa,
  covered: Umbrella,
}

class NotFoundError extends Error {}

export function StationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const req = useSimulatedRequest(() => {
    const s = getStation(id)
    if (!s) throw new NotFoundError('Station not found')
    return s
  }, [id])

  const backBtn = (
    <IconButton icon={ArrowLeft} label="Back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explore'))} className="shadow-card" />
  )

  if (req.status === 'loading') {
    return (
      <Page className="pt-5">
        {backBtn}
        <Skeleton className="mt-4 h-44 rounded-xl" />
        <Skeleton className="mt-5 h-6 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="mt-5 h-40 rounded-lg" />
      </Page>
    )
  }
  if (req.status === 'error') {
    return (
      <Page className="pt-5">
        {backBtn}
        {req.error instanceof NotFoundError ? (
          <EmptyState
            icon={MapPinOff}
            title="Station not found"
            body="This station may have been removed from the sample data, or the link is incorrect."
            action={<ButtonLink to="/explore">Browse stations</ButtonLink>}
          />
        ) : (
          <ErrorState title="Couldn’t load this station" message={req.error.message} onRetry={req.retry} />
        )}
      </Page>
    )
  }
  return <StationView station={req.data} backBtn={backBtn} />
}

function StationView({ station, backBtn }: { station: Station; backBtn: React.ReactNode }) {
  const app = useApp()
  const { model, batteryPct } = useVehicle()
  const here = useUserLocation()
  const navigate = useNavigate()
  const saved = app.savedStationIds.includes(station.id)
  const best = bestConnector(station, model)
  const [chosen, setChosen] = useState<Connector | undefined>(best)
  const [startOpen, setStartOpen] = useState(false)
  const [target, setTarget] = useState(Math.max(app.prefs.targetPct, Math.ceil(batteryPct / 5) * 5 + 5))
  const distance = haversineKm(here, station)
  const fromPct = Math.round(batteryPct)
  const toPct = Math.min(100, Math.max(app.prefs.targetPct, fromPct))

  const estimate = useMemo(() => {
    if (!chosen) return null
    return estimateCharge({
      fromPct,
      toPct,
      model,
      peakKw: effectivePowerKw(chosen, model),
      dc: isDc(chosen.type),
      pricePerKwh: chosen.pricePerKwh,
      sessionFee: station.sessionFee,
    })
  }, [chosen, fromPct, toPct, model, station.sessionFee])

  const activeSession = app.session?.status === 'charging'
  const canStart = !!chosen && chosen.available > 0 && station.status !== 'offline' && !activeSession && batteryPct < 100

  const start = () => {
    if (!chosen) return
    app.startSession({
      stationId: station.id,
      locationName: station.name,
      connectorType: chosen.type,
      peakKw: effectivePowerKw(chosen, model),
      dc: isDc(chosen.type),
      pricePerKwh: chosen.pricePerKwh,
      sessionFee: station.sessionFee,
      startPct: batteryPct,
      targetPct: target,
    })
    navigate('/charging')
  }

  return (
    <Page wide className="pb-6">
      <div className="relative mt-4 overflow-hidden rounded-xl">
        <SimulatedMap
          interactive={false}
          stations={[station]}
          selectedId={station.id}
          user={here}
          initial={{ lat: station.lat, lng: station.lng, scale: 70 }}
          className="h-44 sm:h-56"
        />
        <div className="absolute inset-x-3 top-3 flex justify-between">
          {backBtn}
          <IconButton
            icon={saved ? BookmarkCheck : Bookmark}
            label={saved ? 'Remove from saved' : 'Save station'}
            aria-pressed={saved}
            onClick={() => app.toggleSaved(station.id)}
            className={cx('shadow-card', saved && 'text-primary-ink')}
          />
        </div>
      </div>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8">
        <div className="min-w-0 lg:col-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge station={station} />
            {station.status === 'limited' && (
              <Badge tone="warning" icon={TriangleAlert}>
                Reduced service
              </Badge>
            )}
            <span className="tabular inline-flex items-center gap-1 text-small font-semibold text-ink-2">
              <Star size={14} className="fill-current text-warning" aria-hidden /> {station.rating.toFixed(1)}
              <span className="font-normal text-ink-3">({station.reviews} sample ratings)</span>
            </span>
          </div>
          <h1 className="mt-3 text-headline font-bold">{station.name}</h1>
          <p className="mt-1 text-body text-ink-2">
            {station.address} · <span className="tabular">{formatKm(distance)}</span> away
          </p>
          <p className="mt-0.5 text-small text-ink-3">Operated by {station.operator} (fictional network)</p>

          <Card className="mt-5 grid grid-cols-3 divide-x divide-line p-0">
            <Stat label="Max power" value={stationMaxKw(station)} unit="kW" className="p-4" />
            <Stat label="Free now" value={`${stationAvailable(station)}/${stationTotal(station)}`} className="p-4" />
            <Stat label="From, per kWh" value={stationMinPrice(station)} unit="LKR" className="p-4" />
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
            <ButtonLink to={`/journey?to=${station.id}`} size="lg" icon={Navigation}>
              Navigate
            </ButtonLink>
            <Button variant="secondary" size="lg" icon={Zap} onClick={() => setStartOpen(true)} disabled={!canStart}>
              Start charging
            </Button>
          </div>
          {!canStart && <StartBlockedReason station={station} chosen={chosen} activeSession={activeSession} />}
        </div>

        {/* Estimate + actions */}
        <aside className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div className="lg:sticky lg:top-6">
            <Card className="p-5">
              <h2 className="text-title font-bold">Estimated charge</h2>
              {chosen && estimate ? (
                <>
                  <p className="tabular mt-0.5 text-small text-ink-2">
                    {chosen.type} · {fromPct}% → {toPct}%{toPct === fromPct && ' (already at target)'}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Stat label="Energy" value={estimate.kWh.toFixed(1)} unit="kWh" />
                    <Stat label="Time" value={formatDuration(estimate.minutes)} />
                    <Stat label="Cost" value={formatLkr(estimate.cost).replace('LKR ', '')} unit="LKR" />
                  </div>
                  <p className="mt-4 text-caption text-ink-3">
                    Estimate only. Includes {station.sessionFee ? `a ${formatLkr(station.sessionFee)} session fee and ` : ''}typical charging losses. Real speed
                    depends on battery temperature and the charger.
                  </p>
                </>
              ) : (
                <Notice icon={Info} tone="warning" className="mt-3">
                  This station has no connectors compatible with your {model.name} ({model.connectors.join(', ')}).
                </Notice>
              )}
              <div className="mt-5 hidden flex-col gap-2 lg:flex">
                <ButtonLink to={`/journey?to=${station.id}`} size="lg" icon={Navigation} block>
                  Navigate
                </ButtonLink>
                <Button variant="secondary" size="lg" icon={Zap} onClick={() => setStartOpen(true)} disabled={!canStart} block>
                  Start charging
                </Button>
              </div>
            </Card>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <section className="mt-7" aria-labelledby="connectors">
            <SectionHeader id="connectors" title="Connectors" />
            <Card as="div" className="divide-y divide-line overflow-hidden">
              {station.connectors.map((c, i) => {
                const ok = model.connectors.includes(c.type)
                const eff = effectivePowerKw(c, model)
                const selectable = ok
                const isChosen = chosen === c
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!selectable}
                    onClick={() => setChosen(c)}
                    aria-pressed={isChosen}
                    className={cx(
                      'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                      selectable ? 'hover:bg-surface-2/60' : 'cursor-not-allowed',
                      isChosen && 'bg-primary-soft/60',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        ok ? 'bg-primary-soft text-primary-ink' : 'bg-surface-2 text-ink-3',
                      )}
                    >
                      <Plug size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 text-body font-bold">
                        {c.type} · <span className="tabular">{formatKw(c.powerKw)}</span>
                        <span className="text-caption font-semibold text-ink-3">{isDc(c.type) ? 'DC' : 'AC'}</span>
                      </span>
                      <span className="tabular block text-small text-ink-2">
                        {ok ? (eff < c.powerKw ? `Your car accepts up to ${formatKw(eff)}` : 'Full speed for your car') : 'Not compatible with your vehicle'}
                      </span>
                    </span>
                    <span className="text-right">
                      <span
                        className={cx(
                          'tabular block text-small font-bold',
                          station.status === 'offline' ? 'text-ink-3' : c.available ? 'text-success' : 'text-warning',
                        )}
                      >
                        {station.status === 'offline' ? 'Offline' : `${c.available}/${c.total} free`}
                      </span>
                      <span className="tabular block text-small text-ink-2">{formatLkr(c.pricePerKwh)}/kWh</span>
                    </span>
                  </button>
                )
              })}
            </Card>
            <p className="mt-2 text-caption text-ink-3">
              Availability is a sample snapshot ({station.snapshotMinutes} min old), not live data. Tap a compatible connector to update the estimate.
            </p>
          </section>

          <section className="mt-7" aria-labelledby="amenities">
            <SectionHeader id="amenities" title="Amenities" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {station.amenities.map((a) => {
                const Icon = AMENITY_ICON[a]
                return (
                  <li key={a} className="flex items-center gap-2.5 rounded bg-surface p-3 text-small font-semibold shadow-card">
                    <Icon size={18} className="text-primary-ink" aria-hidden />
                    {AMENITY_LABEL[a]}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="mt-7" aria-labelledby="info">
            <SectionHeader id="info" title="Details" />
            <Card as="div" className="divide-y divide-line">
              <InfoRow icon={Clock} label="Hours" value={station.hours} />
              <InfoRow icon={Zap} label="Session fee" value={station.sessionFee ? formatLkr(station.sessionFee) : 'None'} />
              <InfoRow icon={CircleParking} label="Parking" value={station.parking} />
            </Card>
          </section>
        </div>
      </div>

      <Sheet
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start charging"
        footer={
          <Button size="lg" block icon={Zap} onClick={start} disabled={target <= batteryPct}>
            Start simulated session
          </Button>
        }
      >
        {chosen && (
          <div className="flex flex-col gap-5">
            <div className="rounded bg-surface-2 p-4">
              <p className="text-body font-bold">
                {chosen.type} · up to {formatKw(effectivePowerKw(chosen, model))}
              </p>
              <p className="tabular text-small text-ink-2">
                {station.name} · {formatLkr(chosen.pricePerKwh)}/kWh
              </p>
            </div>
            <Slider
              label="Charge to"
              value={target}
              min={Math.min(100, Math.ceil(batteryPct / 5) * 5 + 5)}
              max={100}
              step={5}
              onChange={setTarget}
              hint={`Your battery is at ${Math.round(batteryPct)}%. Your usual target is ${app.prefs.targetPct}%.`}
            />
            <Notice icon={Info}>
              This is a simulation. Velora doesn’t control real chargers or vehicles — the session runs on sample data so you can preview the experience.
            </Notice>
          </div>
        )}
      </Sheet>
    </Page>
  )
}

function StartBlockedReason({ station, chosen, activeSession }: { station: Station; chosen?: Connector; activeSession: boolean }) {
  const msg = activeSession
    ? 'A charging session is already running.'
    : !chosen
      ? 'No compatible connector at this station.'
      : station.status === 'offline' || availabilityOf(station) === 'offline'
        ? 'This station is offline in the sample data.'
        : chosen.available === 0
          ? `All ${chosen.type} connectors are in use (sample data).`
          : null
  return msg ? <p className="mt-2 text-small text-ink-2 lg:hidden">{msg}</p> : null
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <Icon size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
      <span className="w-28 shrink-0 text-small text-ink-2">{label}</span>
      <span className="text-small font-semibold text-ink">{value}</span>
    </div>
  )
}
