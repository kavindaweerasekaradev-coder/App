import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { BatteryCharging, Check, Clock, Gauge, House, Info, MapPin, Square, Wallet, Zap } from 'lucide-react'
import { useApp, useVehicle } from '@/state/AppState'
import { estimateCharge } from '@/lib/charging'
import { useChartTheme } from '@/lib/chartTheme'
import { cx, formatDuration, formatLkr } from '@/lib/format'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/forms'
import { Card, Notice } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/StateView'

export function ChargingSessionScreen() {
  const app = useApp()
  const { session } = app
  const { model, batteryPct } = useVehicle()
  const navigate = useNavigate()
  const c = useChartTheme()
  const [confirmStop, setConfirmStop] = useState(false)

  if (!session) {
    return (
      <Page>
        <PageHeader title="Charging session" back />
        <Card>
          <EmptyState
            icon={BatteryCharging}
            title="No active session"
            body="Start a simulated session from a station’s details page to preview live charging progress."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink to="/explore" icon={MapPin}>
                  Find a charger
                </ButtonLink>
                {app.prefs.homeCharging && batteryPct < app.prefs.targetPct && (
                  <Button
                    variant="secondary"
                    icon={House}
                    onClick={() =>
                      app.startSession({
                        stationId: 'home',
                        locationName: 'Home charger',
                        connectorType: 'Type 2',
                        peakKw: Math.min(7.4, model.maxAcKw),
                        dc: false,
                        pricePerKwh: app.prefs.homeTariff,
                        sessionFee: 0,
                        startPct: batteryPct,
                        targetPct: app.prefs.targetPct,
                      })
                    }
                  >
                    Simulate home charging
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      </Page>
    )
  }

  const charging = session.status === 'charging'
  const cost = session.kWh * session.pricePerKwh + session.sessionFee
  const remaining = charging
    ? estimateCharge({ fromPct: session.pct, toPct: session.targetPct, model, peakKw: session.peakKw, dc: session.dc, pricePerKwh: 0 }).minutes -
      (session.dc ? 3 : 1)
    : 0
  const progress = (session.pct - session.startPct) / Math.max(1, session.targetPct - session.startPct)

  const R = 88
  const C = 2 * Math.PI * R
  const done = () => {
    app.dismissSession()
    navigate('/')
  }

  return (
    <Page>
      <PageHeader title="Charging session" subtitle={session.locationName} back />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Hero gauge */}
        <section aria-label="Charging progress" className="relative overflow-hidden rounded-xl bg-[#14382B] p-6 text-white shadow-card">
          <div className="flex items-center justify-between">
            <span
              className={cx(
                'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-caption font-bold',
                charging ? 'bg-[#C8F24A] text-[#182608]' : 'bg-white/15 text-white',
              )}
            >
              {charging ? <Zap size={13} aria-hidden /> : <Check size={13} aria-hidden />}
              {charging ? 'Charging' : session.status === 'complete' ? 'Complete' : 'Stopped'}
            </span>
            <span className="tabular text-small text-white/70">
              {session.connectorType} · {session.dc ? 'DC' : 'AC'}
            </span>
          </div>

          <div className="relative mx-auto mt-4 aspect-square w-full max-w-[15rem]">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="100" cy="100" r={R} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke="#C8F24A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - session.pct / 100)}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
              {/* target tick */}
              <line
                x1={100 + (R - 10) * Math.cos((session.targetPct / 100) * 2 * Math.PI)}
                y1={100 + (R - 10) * Math.sin((session.targetPct / 100) * 2 * Math.PI)}
                x2={100 + (R + 10) * Math.cos((session.targetPct / 100) * 2 * Math.PI)}
                y2={100 + (R + 10) * Math.sin((session.targetPct / 100) * 2 * Math.PI)}
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" role="status" aria-live="off">
              <span className="tabular text-[3rem] font-extrabold leading-none tracking-tight">
                {Math.floor(session.pct)}
                <span className="text-headline text-white/70">%</span>
              </span>
              <span className="tabular mt-1.5 text-small text-white/70">Target {session.targetPct}%</span>
            </div>
          </div>

          <p className="tabular mt-4 text-center text-body font-semibold">
            {charging ? (
              <>
                About {formatDuration(remaining)} to {session.targetPct}%
              </>
            ) : session.status === 'complete' ? (
              'Reached your target'
            ) : (
              `Stopped at ${Math.round(session.pct)}%`
            )}
          </p>
          <span className="sr-only" aria-live="polite">
            {charging ? `Battery at ${Math.floor(session.pct / 5) * 5} percent` : 'Charging finished'}
          </span>
        </section>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric icon={BatteryCharging} label="Energy delivered" value={session.kWh.toFixed(1)} unit="kWh" />
            <Metric icon={Gauge} label="Charging speed" value={charging ? session.currentKw.toFixed(1) : '0'} unit="kW" />
            <Metric icon={Clock} label={charging ? 'Time remaining' : 'Duration'} value={formatDuration(charging ? remaining : session.elapsedMin)} />
            <Metric icon={Wallet} label="Session cost" value={formatLkr(cost)} />
          </div>

          <Card className="p-4">
            <div className="flex justify-between text-small">
              <span className="text-ink-2">Session progress</span>
              <span className="tabular font-bold">{Math.round(Math.min(1, progress) * 100)}%</span>
            </div>
            <div
              className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-label="Session progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.min(1, progress) * 100}%` }}
              />
            </div>
            <div className="tabular mt-1.5 flex justify-between text-caption text-ink-3">
              <span>Started {Math.round(session.startPct)}%</span>
              <span>Elapsed {formatDuration(session.elapsedMin)}</span>
              <span>Target {session.targetPct}%</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-small font-semibold">Power</p>
              <p className="tabular text-caption text-ink-3">peak {session.peakKw} kW</p>
            </div>
            <div className="mt-2 h-20" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={session.powerTrace} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={c.primary} stopOpacity={0.3} />
                      <stop offset="1" stopColor={c.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, session.peakKw * 1.1]} />
                  <Area type="monotone" dataKey="kw" stroke={c.primary} strokeWidth={2} fill="url(#pw)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {charging ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-small font-semibold">Demo speed</p>
                <p className="text-caption text-ink-3">Simulated time per real second</p>
              </div>
              <Segmented
                label="Demo speed"
                size="sm"
                value={String(session.speed)}
                onChange={(v) => app.setSessionSpeed(Number(v))}
                options={[
                  { value: '1', label: '1 min' },
                  { value: '5', label: '5 min' },
                  { value: '15', label: '15 min' },
                ]}
              />
            </div>
            <Button variant="danger" size="lg" icon={Square} block onClick={() => setConfirmStop(true)}>
              Stop charging
            </Button>
          </>
        ) : (
          <Card className="p-5">
            <h2 className="text-title font-bold">Session summary</h2>
            <dl className="tabular mt-3 grid grid-cols-2 gap-y-2 text-small sm:grid-cols-4">
              <dt className="text-ink-2">Added</dt>
              <dd className="text-right font-bold sm:text-left">
                {Math.round(session.startPct)}% → {Math.round(session.pct)}%
              </dd>
              <dt className="text-ink-2">Energy</dt>
              <dd className="text-right font-bold sm:text-left">{session.kWh.toFixed(1)} kWh</dd>
              <dt className="text-ink-2">Duration</dt>
              <dd className="text-right font-bold sm:text-left">{formatDuration(session.elapsedMin)}</dd>
              <dt className="text-ink-2">Est. cost</dt>
              <dd className="text-right font-bold sm:text-left">{formatLkr(cost)}</dd>
            </dl>
            <p className="mt-3 text-caption text-ink-3">Saved to your charging history in Insights.</p>
            <Button size="lg" block className="mt-4" onClick={done}>
              Done
            </Button>
          </Card>
        )}
        <Notice icon={Info}>
          Simulated session. Velora isn’t connected to your vehicle or the charger; figures follow a typical charging curve and are estimates.
        </Notice>
      </div>

      <Sheet
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop charging?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" block onClick={() => setConfirmStop(false)}>
              Keep charging
            </Button>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => {
                app.stopSession()
                setConfirmStop(false)
              }}
            >
              Stop now
            </Button>
          </div>
        }
      >
        <p className="text-body text-ink-2">
          Your battery is at <span className="tabular font-bold text-ink">{Math.round(session.pct)}%</span> — below your {session.targetPct}% target. You’ll be
          charged for <span className="tabular font-bold text-ink">{session.kWh.toFixed(1)} kWh</span> (about {formatLkr(cost)}).
        </p>
      </Sheet>
    </Page>
  )
}

function Metric({ icon: Icon, label, value, unit }: { icon: typeof Zap; label: string; value: string; unit?: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-small text-ink-2">
        <Icon size={15} className="text-ink-3" aria-hidden />
        {label}
      </p>
      <p className="tabular mt-1.5 truncate text-headline font-bold">
        {value}
        {unit && <span className="ml-1 text-small font-semibold text-ink-2">{unit}</span>}
      </p>
    </div>
  )
}
