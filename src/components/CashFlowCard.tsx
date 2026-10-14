import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Table2, TrendingUp } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { cashFlowSeries } from '../lib/finance'
import { monthLabel } from '../lib/dates'
import { CardHeader, Segmented } from './ui'

const HEIGHT = 270
const PAD = { top: 16, right: 4, bottom: 28, left: 44 }
const BAR = 20
const PAIR_GAP = 2

function niceMax(v: number) {
  if (v <= 0) return 1000
  const pow = 10 ** Math.floor(Math.log10(v))
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  return steps.map((s) => s * pow).find((s) => s >= v)!
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.clientWidth)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function CashFlowCard() {
  const { state } = useFinance()
  const { money, hidden } = useDisplay()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)
  const [wrap, width] = useWidth<HTMLDivElement>()

  const series = useMemo(() => cashFlowSeries(state.transactions, 6), [state.transactions])
  const totalNet = series.reduce((s, m) => s + m.net, 0)
  const max = niceMax(Math.max(...series.flatMap((m) => [m.income, m.expenses])))
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max]

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band = plotW / series.length
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const bar = Math.min(BAR, (band - 16) / 2)

  // Column with a 4px rounded data-end and a square baseline.
  const column = (x: number, v: number) => {
    const top = y(v)
    const h = PAD.top + plotH - top
    if (h <= 0) return ''
    const r = Math.min(4, h, bar / 2)
    const base = PAD.top + plotH
    return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + bar - r}Q${x + bar},${top} ${x + bar},${top + r}V${base}Z`
  }

  const active = hover !== null ? series[hover] : null

  return (
    <section className="card cashflow" aria-labelledby="cashflow-title">
      <CardHeader
        icon={<TrendingUp size={18} />}
        title="Cash flow"
        subtitle={`Last 6 months · net ${money(totalNet, { signed: true, decimals: false })}`}
        action={
          <Segmented
            label="Cash flow view"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: <BarChart3 size={16} />, ariaLabel: 'Chart' },
              { value: 'table', label: <Table2 size={16} />, ariaLabel: 'Table' },
            ]}
          />
        }
      />
      <span id="cashflow-title" className="sr-only">
        Cash flow
      </span>

      <div className="chart-legend" aria-hidden={view === 'table'}>
        <span>
          <i style={{ background: 'var(--series-in)' }} /> Money in
        </span>
        <span>
          <i style={{ background: 'var(--series-out)' }} /> Money out
        </span>
      </div>

      {view === 'chart' ? (
        <div className="chart" ref={wrap} onMouseLeave={() => setHover(null)}>
          {width > 0 && (
            <svg width={width} height={HEIGHT} role="img" aria-label="Money in and money out per month for the last six months. Switch to table view for exact values.">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'chart__baseline' : 'chart__grid'} />
                  <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="chart__tick">
                    {hidden ? '•' : money(t, { compact: true, decimals: false })}
                  </text>
                </g>
              ))}
              {series.map((m, i) => {
                const cx = PAD.left + band * i + band / 2
                const x0 = cx - bar - PAIR_GAP / 2
                return (
                  <g key={m.key} className={hover !== null && hover !== i ? 'is-dim' : ''}>
                    {hover === i && <rect x={PAD.left + band * i + 4} y={PAD.top} width={band - 8} height={plotH} rx={10} className="chart__hover" />}
                    <path d={column(x0, m.income)} fill="var(--series-in)" />
                    <path d={column(x0 + bar + PAIR_GAP, m.expenses)} fill="var(--series-out)" />
                    <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="chart__tick chart__tick--x">
                      {monthLabel(m.key, 'short')}
                    </text>
                    <rect x={PAD.left + band * i} y={0} width={band} height={HEIGHT} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
                  </g>
                )
              })}
            </svg>
          )}
          {active && hover !== null && (
            <div
              className="tooltip"
              role="status"
              style={{
                left: Math.min(Math.max(PAD.left + band * hover + band / 2, 90), width - 90),
                top: Math.max(0, y(Math.max(active.income, active.expenses)) - 12),
              }}
            >
              <p className="tooltip__title">{monthLabel(active.key)}</p>
              <p className="tooltip__row">
                <i style={{ background: 'var(--series-in)' }} /> In <strong>{money(active.income, { decimals: false })}</strong>
              </p>
              <p className="tooltip__row">
                <i style={{ background: 'var(--series-out)' }} /> Out <strong>{money(active.expenses, { decimals: false })}</strong>
              </p>
              <p className="tooltip__row tooltip__net">
                Net <strong className={active.net >= 0 ? 'text-pos' : 'text-neg'}>{money(active.net, { signed: true, decimals: false })}</strong>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Money in</th>
                <th scope="col">Money out</th>
                <th scope="col">Net</th>
              </tr>
            </thead>
            <tbody>
              {series.map((m) => (
                <tr key={m.key}>
                  <th scope="row">{monthLabel(m.key)}</th>
                  <td>{money(m.income)}</td>
                  <td>{money(m.expenses)}</td>
                  <td className={m.net >= 0 ? 'text-pos' : 'text-neg'}>{money(m.net, { signed: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
