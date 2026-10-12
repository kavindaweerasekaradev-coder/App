import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BatteryCharging, Bell, BellOff, CalendarClock, ChevronRight, Gauge, House, MapPin, Plug, Route, TriangleAlert, Zap } from 'lucide-react'
import { useApp, useVehicle } from '@/state/AppState'
import { STATIONS } from '@/data/stations'
import { availabilityOf, estimateCharge, estimatedRangeKm, isCompatible } from '@/lib/charging'
import { cx, formatDuration, formatKm, formatKw, formatLkr, formatRelativeDay, greeting } from '@/lib/format'
import { haversineKm } from '@/lib/geo'
import { useChargingHistory, useUserLocation } from '@/lib/hooks'
import { Page } from '@/components/layout/AppShell'
import { Button, ButtonLink, IconButton } from '@/components/ui/Button'
import { Badge, Card, ProgressBar, SectionHeader } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/StateView'
import { Sheet } from '@/components/ui/Sheet'
import { CarIllustration } from '@/components/vehicle/CarIllustration'
import { AvailabilityBadge } from '@/components/station/StationBits'
import type { SessionRecord } from '@/data/types'

export function Home() {
  const app = useApp()
  const { vehicle, model, batteryPct } = useVehicle()
  const { prefs, session } = app
  const here = useUserLocation()
  const history = useChargingHistory()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  const charging = session?.status === 'charging'
  const range = estimatedRangeKm(model, batteryPct)
  const low = batteryPct <= prefs.reservePct + 10

  const nearby = useMemo(
    () =>
      STATIONS.filter((s) => isCompatible(s, model) && availabilityOf(s) !== 'offline')
        .map((s) => ({ s, d: haversineKm(here, s) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 6),
    [model, here],
  )
  const nearbyAvailable = useMemo(
    () => STATIONS.filter((s) => isCompatible(s, model) && availabilityOf(s) === 'available' && haversineKm(here, s) <= 10).length,
    [model, here],
  )

  const homePeak = Math.min(7.4, model.maxAcKw)
  const homeEstimate = estimateCharge({ fromPct: batteryPct, toPct: prefs.targetPct, model, peakKw: homePeak, dc: false, pricePerKwh: prefs.homeTariff })

  const startHome = () => {
    app.startSession({
      stationId: 'home',
      locationName: 'Home charger',
      connectorType: 'Type 2',
      peakKw: homePeak,
      dc: false,
      pricePerKwh: prefs.homeTariff,
      sessionFee: 0,
      startPct: batteryPct,
      targetPct: prefs.targetPct,
    })
    navigate('/charging')
  }

  const notifications = [
    session?.status === 'complete' &&
      app.notifications.chargeComplete && {
        icon: BatteryCharging,
        title: 'Charging complete',
        body: `${vehicle.nickname} reached ${Math.round(session.pct)}%.`,
      },
    low &&
      app.notifications.lowBattery && {
        icon: TriangleAlert,
        title: 'Battery getting low',
        body: `${Math.round(batteryPct)}% · about ${formatKm(range)} of estimated range left.`,
      },
    app.notifications.chargeReminder &&
      prefs.homeCharging &&
      !charging &&
      batteryPct < prefs.targetPct - 20 && {
        icon: Plug,
        title: 'Plug in tonight',
        body: `You’re at ${Math.round(batteryPct)}%. Home charging to ${prefs.targetPct}% from ${prefs.homeStartTime} is estimated at ${formatLkr(homeEstimate.cost)}.`,
      },
    app.notifications.weeklySummary && {
      icon: CalendarClock,
      title: 'Your weekly energy summary is ready',
      body: 'See consumption and charging spend in Insights.',
    },
  ].filter(Boolean) as { icon: typeof Bell; title: string; body: string }[]

  const name = vehicle.ownerName || 'there'
  const initials = (vehicle.ownerName || vehicle.nickname || 'V').slice(0, 1).toUpperCase()

  return (
    <Page wide>
      {/* Header */}
      <header className="flex items-center gap-3 pb-5 pt-5">
        <Link
          to="/profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-title font-bold text-accent"
          aria-label="Profile"
        >
          {initials}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title font-bold">
            {greeting()}, {name}
          </h1>
          <p className="flex items-center gap-1 truncate text-small text-ink-2">
            <MapPin size={13} aria-hidden /> {here.name}
          </p>
        </div>
        <IconButton
          icon={Bell}
          label={`Notifications${notifications.length ? ` (${notifications.length})` : ''}`}
          badge={notifications.length > 0}
          onClick={() => setNotifOpen(true)}
        />
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Vehicle overview */}
          <Card as="section" aria-labelledby="vehicle-title" className="overflow-hidden rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="vehicle-title" className="truncate text-title font-bold">
                  {vehicle.nickname}
                </h2>
                <p className="truncate text-small text-ink-2">
                  {model.maker} {model.name}
                  {vehicle.plate && <span className="tabular"> · {vehicle.plate}</span>}
                </p>
              </div>
              {charging ? (
                <Badge tone="accent" icon={Zap}>
                  Charging · {formatKw(Math.round(session!.currentKw))}
                </Badge>
              ) : low ? (
                <Badge tone="warning" icon={TriangleAlert}>
                  Low battery
                </Badge>
              ) : (
                <Badge tone="neutral" dot>
                  Parked
                </Badge>
              )}
            </div>

            <div className="relative -mx-2 mt-2 sm:mx-6">
              <CarIllustration color={vehicle.color} charging={charging} />
            </div>

            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-small text-ink-2">Battery</p>
                <p className="tabular text-metric font-extrabold">
                  {Math.round(batteryPct)}
                  <span className="text-headline font-bold text-ink-2">%</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-small text-ink-2">Estimated range</p>
                <p className="tabular text-headline font-bold">~{formatKm(range)}</p>
              </div>
            </div>
            <ProgressBar
              value={batteryPct}
              marker={prefs.targetPct}
              tone={charging ? 'accent' : low ? 'warning' : 'primary'}
              label="Battery level"
              className="mt-3"
              height="h-2.5"
            />
            <div className="mt-2 flex justify-between text-caption text-ink-3">
              <span>Reserve {prefs.reservePct}%</span>
              <span>Target {prefs.targetPct}%</span>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-caption text-ink-3">
              Range is an estimate based on {model.efficiency} kWh/100 km average use. Battery level is from your setup or simulated sessions — Velora isn’t
              connected to your vehicle.
            </p>
          </Card>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/explore"
              className="group flex flex-col justify-between rounded-xl bg-primary p-4 text-primary-fg shadow-card transition-transform active:scale-[0.98] sm:p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-fg">
                <Zap size={20} aria-hidden />
              </span>
              <span className="mt-6">
                <span className="flex items-center justify-between text-title font-bold">
                  Find charging <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-0.5 block text-small text-primary-fg/75">{nearbyAvailable} available nearby</span>
              </span>
            </Link>
            <Link
              to="/journey"
              className="group flex flex-col justify-between rounded-xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line transition-transform active:scale-[0.98] sm:p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                <Route size={20} aria-hidden />
              </span>
              <span className="mt-6">
                <span className="flex items-center justify-between text-title font-bold">
                  Plan a journey <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-0.5 block text-small text-ink-2">Stops & arrival charge</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Charging status */}
          <Card as="section" aria-labelledby="charging-status" className="p-5">
            <h2 id="charging-status" className="label">
              Charging status
            </h2>
            {session && session.status === 'charging' ? (
              <Link to="/charging" className="mt-3 block">
                <div className="flex items-center justify-between">
                  <p className="text-title font-bold">{session.locationName}</p>
                  <ChevronRight size={18} className="text-ink-3" aria-hidden />
                </div>
                <p className="tabular text-small text-ink-2">
                  {Math.round(session.pct)}% → {session.targetPct}% · {formatKw(Math.round(session.currentKw))}
                </p>
                <ProgressBar value={session.pct} label="Charging progress" tone="accent" className="mt-3" />
              </Link>
            ) : session ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-title font-bold">{session.status === 'complete' ? 'Charging complete' : 'Session stopped'}</p>
                  <p className="tabular text-small text-ink-2">
                    {Math.round(session.pct)}% · {session.kWh.toFixed(1)} kWh · {formatLkr(session.kWh * session.pricePerKwh + session.sessionFee)}
                  </p>
                </div>
                <ButtonLink to="/charging" variant="secondary" size="sm">
                  Summary
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                    <Plug size={18} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-bold">Not charging</p>
                    {prefs.homeCharging ? (
                      <p className="text-small text-ink-2">
                        Home charging usually starts at <span className="tabular">{prefs.homeStartTime}</span>.{' '}
                        {batteryPct < prefs.targetPct && (
                          <span className="tabular">
                            To {prefs.targetPct}%: ~{formatDuration(homeEstimate.minutes)}, est. {formatLkr(homeEstimate.cost)}.
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-small text-ink-2">Find a compatible public charger when you need one.</p>
                    )}
                  </div>
                </div>
                {prefs.homeCharging && (
                  <Button variant="secondary" size="sm" icon={House} className="mt-4" onClick={startHome} disabled={batteryPct >= prefs.targetPct}>
                    {batteryPct >= prefs.targetPct ? 'Already at target' : 'Simulate home charging'}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Nearby */}
          <section aria-labelledby="nearby">
            <SectionHeader id="nearby" title="Nearby chargers" action="See all" to="/explore" />
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0">
              {nearby.slice(0, 4).map(({ s, d }) => (
                <Link key={s.id} to={`/stations/${s.id}`} className="card w-64 shrink-0 snap-start p-4 transition-shadow hover:shadow-float lg:w-auto">
                  <p className="truncate text-body font-bold">{s.name}</p>
                  <p className="tabular mt-0.5 text-small text-ink-2">
                    {formatKm(d)} · up to {Math.max(...s.connectors.map((c) => c.powerKw))} kW
                  </p>
                  <div className="mt-3">
                    <AvailabilityBadge station={s} />
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-caption text-ink-3">Availability is sample data, not live.</p>
          </section>
        </div>
      </div>

      {/* Recent activity */}
      <section aria-labelledby="recent" className="mt-6">
        <SectionHeader id="recent" title="Recent activity" action="Insights" to="/insights" />
        {history.length === 0 ? (
          <Card>
            <EmptyState icon={Gauge} title="No activity yet" body="Charging sessions you complete will appear here." />
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {history.slice(0, 4).map((h) => (
              <ActivityRow key={h.id} item={h} />
            ))}
          </Card>
        )}
      </section>

      <Sheet open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        {notifications.length === 0 ? (
          <EmptyState icon={BellOff} title="You’re all caught up" body="Notification types can be turned on in Profile." />
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((n) => (
              <li key={n.title} className="flex gap-3 rounded bg-surface-2 p-3.5">
                <n.icon size={20} className="mt-0.5 shrink-0 text-primary-ink" aria-hidden />
                <div>
                  <p className="text-body font-bold">{n.title}</p>
                  <p className="text-small text-ink-2">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </Page>
  )
}

export function ActivityRow({ item }: { item: SessionRecord }) {
  const Icon = item.kind === 'home' ? House : Zap
  const inner = (
    <>
      <span
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          item.kind === 'home' ? 'bg-surface-2 text-ink-2' : 'bg-primary-soft text-primary-ink',
        )}
      >
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold">{item.location}</p>
        <p className="tabular truncate text-small text-ink-2">
          {formatRelativeDay(item.date)} · {item.startPct}% → {item.endPct}%
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-body font-bold">{formatLkr(item.cost)}</p>
        <p className="tabular text-small text-ink-2">{item.kWh.toFixed(1)} kWh</p>
      </div>
    </>
  )
  return item.stationId ? (
    <Link to={`/stations/${item.stationId}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/60">
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
  )
}
