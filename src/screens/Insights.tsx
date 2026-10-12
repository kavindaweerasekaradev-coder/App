import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BatteryCharging, CalendarRange, Gauge, House, Lightbulb, Route, Wallet, Zap } from 'lucide-react'
import { useVehicle } from '@/state/AppState'
import { useChartTheme } from '@/lib/chartTheme'
import { formatKm, formatLkr } from '@/lib/format'
import { useChargingHistory, useUsage } from '@/lib/hooks'
import { useSimulatedRequest } from '@/lib/useSimulatedRequest'
import type { SessionRecord } from '@/data/types'
import type { DayUsage } from '@/data/history'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/forms'
import { Card, SectionHeader, Skeleton } from '@/components/ui/primitives'
import { EmptyState, ErrorState } from '@/components/ui/StateView'
import { ActivityRow } from './Home'

type Period = '30d' | '6m'
type Kind = 'all' | 'home' | 'public'

const monthKey = (iso: string) => {
  const x = new Date(iso)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}
const monthLabel = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short' })

function compute(usage: DayUsage[], history: SessionRecord[], period: Period) {
  const now = Date.now()
  const days = period === '30d' ? 30 : 182
  const since = now - days * 86_400_000
  const u = usage.filter((d) => new Date(d.date).getTime() >= since)
  const h = history.filter((s) => new Date(s.date).getTime() >= since)

  const kWh = u.reduce((n, d) => n + d.kWh, 0)
  const km = u.reduce((n, d) => n + d.km, 0)
  const spend = h.reduce((n, s) => n + s.cost, 0)
  const chargedKwh = h.reduce((n, s) => n + s.kWh, 0)

  const consumption =
    period === '30d'
      ? u.map((d) => ({ label: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), kWh: d.kWh }))
      : Object.entries(
          u.reduce<Record<string, number>>((acc, d) => {
            acc[monthKey(d.date)] = (acc[monthKey(d.date)] ?? 0) + d.kWh
            return acc
          }, {}),
        ).map(([k, v]) => ({ label: monthLabel(k), kWh: +v.toFixed(1) }))

  // Expenditure: always the last six calendar months.
  const localKey = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
  const months: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) months.push(localKey(new Date(d.getFullYear(), d.getMonth() - i, 1)))
  const spendByMonth = months.map((key) => {
    const ms = history.filter((s) => localKey(new Date(s.date)) === key)
    return {
      label: monthLabel(key),
      home: Math.round(ms.filter((s) => s.kind === 'home').reduce((n, s) => n + s.cost, 0)),
      public: Math.round(ms.filter((s) => s.kind !== 'home').reduce((n, s) => n + s.cost, 0)),
    }
  })

  const avgPerKwh = (list: SessionRecord[]) => {
    const e = list.reduce((n, s) => n + s.kWh, 0)
    return e ? list.reduce((n, s) => n + s.cost, 0) / e : 0
  }
  const home = h.filter((s) => s.kind === 'home')
  const dc = h.filter((s) => s.kind === 'public-dc')
  const homeRate = avgPerKwh(home)
  const dcRate = avgPerKwh(dc)

  const weekday = u.filter((x) => ![0, 6].includes(new Date(x.date).getDay()) && x.km > 0)
  const weekend = u.filter((x) => [0, 6].includes(new Date(x.date).getDay()) && x.km > 0)
  const eff = (list: DayUsage[]) => {
    const k = list.reduce((n, x) => n + x.km, 0)
    return k ? (list.reduce((n, x) => n + x.kWh, 0) / k) * 100 : 0
  }
  const topMonth = [...spendByMonth].sort((a, b) => b.home + b.public - (a.home + a.public))[0]

  const insights: { icon: typeof Zap; title: string; body: string }[] = []
  if (homeRate && dcRate) {
    insights.push({
      icon: House,
      title: `Home charging cost ${Math.round((1 - homeRate / dcRate) * 100)}% less per kWh`,
      body: `In this period you paid about ${formatLkr(homeRate)}/kWh at home versus ${formatLkr(dcRate)}/kWh at public DC chargers.`,
    })
  }
  if (weekday.length && weekend.length) {
    const wd = eff(weekday)
    const we = eff(weekend)
    insights.push({
      icon: Gauge,
      title: we < wd ? 'Weekend trips were more efficient' : 'Weekday driving was more efficient',
      body: `Average ${Math.min(wd, we).toFixed(1)} vs ${Math.max(wd, we).toFixed(1)} kWh/100 km. Stop-and-go traffic typically uses more energy than steady cruising.`,
    })
  }
  if (dc.length) {
    const avgEnd = dc.reduce((n, s) => n + s.endPct, 0) / dc.length
    insights.push({
      icon: Zap,
      title: `Fast-charge sessions ended at ${Math.round(avgEnd)}% on average`,
      body: 'Charging speed usually drops above 80%, so stopping around there keeps public sessions shorter.',
    })
  }
  if (topMonth && topMonth.home + topMonth.public > 0) {
    insights.push({
      icon: CalendarRange,
      title: `${topMonth.label} was your highest-spend month`,
      body: `${formatLkr(topMonth.home + topMonth.public)} in total, ${formatLkr(topMonth.public)} of it at public chargers.`,
    })
  }

  return {
    kWh,
    km,
    efficiency: km ? (kWh / km) * 100 : 0,
    spend,
    chargedKwh,
    sessions: h.length,
    avgRate: avgPerKwh(h),
    consumption,
    avgConsumption: consumption.length ? consumption.reduce((n, x) => n + x.kWh, 0) / consumption.length : 0,
    spendByMonth,
    insights,
    history: h,
  }
}

export function Insights() {
  const { model } = useVehicle()
  const usage = useUsage()
  const history = useChargingHistory()
  const c = useChartTheme()
  const [period, setPeriod] = useState<Period>('30d')
  const [kind, setKind] = useState<Kind>('all')
  const [showAll, setShowAll] = useState(false)
  const req = useSimulatedRequest(() => compute(usage, history, period), [usage, history, period], 600)

  const list = useMemo(() => {
    if (req.status !== 'success') return []
    return req.data.history.filter((s) => kind === 'all' || (kind === 'home' ? s.kind === 'home' : s.kind !== 'home'))
  }, [req.status, req.data, kind])

  const tooltipStyle = { background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12, color: c.ink }

  return (
    <Page wide>
      <PageHeader
        title="Energy insights"
        subtitle="Sample data"
        actions={
          <Segmented<Period>
            label="Period"
            size="sm"
            value={period}
            onChange={(p) => {
              setPeriod(p)
              setShowAll(false)
            }}
            options={[
              { value: '30d', label: '30 days' },
              { value: '6m', label: '6 months' },
            ]}
          />
        }
      />

      {req.status === 'loading' && (
        <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading insights">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        </div>
      )}

      {req.status === 'error' && (
        <Card>
          <ErrorState title="Couldn’t load insights" message={req.error.message} onRetry={req.retry} />
        </Card>
      )}

      {req.status === 'success' && (
        <div className="flex animate-fade-up flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={BatteryCharging} label="Energy used" value={req.data.kWh.toFixed(0)} unit="kWh" sub={`${formatKm(req.data.km)} driven`} />
            <Kpi icon={Gauge} label="Efficiency" value={req.data.efficiency.toFixed(1)} unit="kWh/100 km" sub={`rated ${model.efficiency}`} />
            <Kpi
              icon={Wallet}
              label="Charging spend"
              value={formatLkr(req.data.spend).replace('LKR ', '')}
              unit="LKR"
              sub={`${formatLkr(req.data.avgRate)}/kWh avg`}
            />
            <Kpi icon={Zap} label="Sessions" value={String(req.data.sessions)} sub={`${req.data.chargedKwh.toFixed(0)} kWh charged`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card as="section" aria-labelledby="consumption" className="p-4 sm:p-5">
              <SectionHeader id="consumption" title="Energy consumption" />
              <p className="-mt-2 mb-3 text-small text-ink-2">
                {period === '30d' ? 'kWh per day' : 'kWh per month'} · average{' '}
                <span className="tabular font-semibold text-ink">{req.data.avgConsumption.toFixed(1)}</span>
              </p>
              <div
                className="h-56"
                role="img"
                aria-label={`Bar chart of energy consumption, average ${req.data.avgConsumption.toFixed(1)} kWh per ${period === '30d' ? 'day' : 'month'}.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={req.data.consumption} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={c.grid} />
                    <XAxis dataKey="label" stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} interval={period === '30d' ? 6 : 0} />
                    <YAxis stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: c.grid, opacity: 0.4 }} contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kWh`, 'Used']} />
                    <ReferenceLine y={req.data.avgConsumption} stroke={c.axis} strokeDasharray="4 4" />
                    <Bar dataKey="kWh" fill={c.primary} radius={[4, 4, 0, 0]} maxBarSize={period === '30d' ? 12 : 36} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card as="section" aria-labelledby="spend" className="p-4 sm:p-5">
              <SectionHeader id="spend" title="Monthly charging spend" />
              <p className="-mt-2 mb-3 text-small text-ink-2">LKR, last 6 months · home vs public</p>
              <div className="h-56" role="img" aria-label="Stacked bar chart of monthly charging spend split into home and public charging.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={req.data.spendByMonth} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={c.grid} />
                    <XAxis dataKey="label" stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke={c.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                    />
                    <Tooltip
                      cursor={{ fill: c.grid, opacity: 0.4 }}
                      contentStyle={tooltipStyle}
                      formatter={(v: number, n: string) => [formatLkr(v), n === 'home' ? 'Home' : 'Public']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span style={{ color: c.axis, fontSize: 12 }}>{v === 'home' ? 'Home' : 'Public'}</span>}
                    />
                    <Bar dataKey="home" stackId="s" fill={c.primarySoft} maxBarSize={36} isAnimationActive={false} />
                    <Bar dataKey="public" stackId="s" fill={c.primary} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {req.data.insights.length > 0 && (
            <section aria-labelledby="tips">
              <SectionHeader id="tips" title="What your data shows" />
              <div className="grid gap-3 sm:grid-cols-2">
                {req.data.insights.map((i) => (
                  <Card key={i.title} className="flex gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                      <i.icon size={18} aria-hidden />
                    </span>
                    <div>
                      <p className="text-body font-bold">{i.title}</p>
                      <p className="mt-0.5 text-small text-ink-2">{i.body}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-caption text-ink-3">
                <Lightbulb size={13} aria-hidden /> Calculated from the sample history shown on this page.
              </p>
            </section>
          )}

          <section aria-labelledby="history">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="history" className="text-title font-bold">
                Charging history
              </h2>
              <Segmented<Kind>
                label="Filter history"
                size="sm"
                value={kind}
                onChange={(k) => {
                  setKind(k)
                  setShowAll(false)
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'home', label: 'Home' },
                  { value: 'public', label: 'Public' },
                ]}
              />
            </div>
            {list.length === 0 ? (
              <Card>
                <EmptyState icon={Route} title="No sessions here" body={`No ${kind === 'all' ? '' : kind + ' '}charging sessions in this period.`} />
              </Card>
            ) : (
              <>
                <Card className="divide-y divide-line overflow-hidden">
                  {(showAll ? list : list.slice(0, 6)).map((s) => (
                    <ActivityRow key={s.id} item={s} />
                  ))}
                </Card>
                {list.length > 6 && (
                  <Button variant="ghost" className="mt-2" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show fewer' : `Show all ${list.length} sessions`}
                  </Button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </Page>
  )
}

function Kpi({ icon: Icon, label, value, unit, sub }: { icon: typeof Zap; label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-small text-ink-2">
        <Icon size={15} className="text-ink-3" aria-hidden /> {label}
      </p>
      <p className="tabular mt-1.5 truncate text-headline font-bold">
        {value}
        {unit && <span className="ml-1 text-caption font-semibold text-ink-2">{unit}</span>}
      </p>
      {sub && <p className="tabular truncate text-caption text-ink-3">{sub}</p>}
    </div>
  )
}
