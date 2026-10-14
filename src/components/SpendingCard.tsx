import { useMemo, useState } from 'react'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { change, comparisonPeriod, currentMonthKey, spendByCategory, spendingInsight } from '../lib/finance'
import { lastMonths, monthLabel } from '../lib/dates'
import { formatPercent } from '../lib/format'
import { EXPENSE_CATEGORIES, categoryColor, getCategory } from '../data/categories'
import { CardHeader, Delta } from './ui'
import type { CategoryId } from '../types'

const SIZE = 220
const STROKE = 18
const R = (SIZE - STROKE) / 2 - 4
const C = SIZE / 2
const GAP = 4 // px of surface between neighbouring caps

function polar(angle: number) {
  const a = ((angle - 90) * Math.PI) / 180
  return [C + R * Math.cos(a), C + R * Math.sin(a)]
}

function arc(start: number, end: number) {
  const [x1, y1] = polar(start)
  const [x2, y2] = polar(end)
  const large = end - start > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export function SpendingCard() {
  const { state } = useFinance()
  const { money } = useDisplay()
  const [month, setMonth] = useState(currentMonthKey())
  const [active, setActive] = useState<CategoryId | null>(null)

  const spend = useMemo(() => spendByCategory(state.transactions, month), [state.transactions, month])
  const period = comparisonPeriod(month)
  const prevSpend = useMemo(() => spendByCategory(state.transactions, period.prevKey, period.uptoDay), [state.transactions, period.prevKey, period.uptoDay])
  const total = EXPENSE_CATEGORIES.reduce((s, c) => s + spend[c.id], 0)
  const prevTotal = EXPENSE_CATEGORIES.reduce((s, c) => s + prevSpend[c.id], 0)
  const insight = spendingInsight(state.transactions, month)

  // Segments keep the fixed category order — the colour adjacency was validated in this order.
  const capDeg = ((STROKE / 2 + GAP / 2) / (2 * Math.PI * R)) * 360
  const segments = EXPENSE_CATEGORIES.filter((c) => spend[c.id] > 0).reduce<{ id: CategoryId; start: number; end: number; sweep: number }[]>((acc, c) => {
    const offset = acc.length ? acc[acc.length - 1].start - capDeg + acc[acc.length - 1].sweep : 0
    const sweep = total ? (spend[c.id] / total) * 360 : 0
    const start = offset + capDeg
    acc.push({ id: c.id, start, end: Math.max(start + 0.01, offset + sweep - capDeg), sweep })
    return acc
  }, [])

  const focus = active ? { label: getCategory(active).name, value: spend[active], share: total ? spend[active] / total : 0 } : null

  return (
    <section className="card spending" aria-labelledby="spending-title">
      <CardHeader
        icon={<ShoppingBag size={18} />}
        title="Spending"
        action={
          <label className="select-pill">
            <span className="sr-only">Month</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {lastMonths(6)
                .reverse()
                .map((k) => (
                  <option key={k} value={k}>
                    {monthLabel(k)}
                  </option>
                ))}
            </select>
          </label>
        }
      />
      <span id="spending-title" className="sr-only">
        Spending by category for {monthLabel(month)}
      </span>

      <div className="donut" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Spending by category, ${monthLabel(month)}. Total ${money(total)}.`}>
          <circle cx={C} cy={C} r={R} className="donut__track" strokeWidth={STROKE} />
          {segments.map((s) =>
            s.sweep < capDeg * 2 + 0.5 ? (
              <circle key={s.id} cx={polar(s.start - capDeg + s.sweep / 2)[0]} cy={polar(s.start - capDeg + s.sweep / 2)[1]} r={STROKE / 2 - 2} fill={categoryColor(s.id)} />
            ) : (
              <path
                key={s.id}
                d={arc(s.start, s.end)}
                stroke={categoryColor(s.id)}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                className={`donut__seg ${active && active !== s.id ? 'is-dim' : ''}`}
              />
            ),
          )}
          {/* Wider invisible hit targets so thin segments are easy to hover. */}
          {segments.map((s) => (
            <path key={`hit-${s.id}`} d={arc(s.start - capDeg, s.start - capDeg + Math.max(s.sweep, 1))} stroke="transparent" strokeWidth={STROKE + 18} fill="none" onMouseEnter={() => setActive(s.id)} />
          ))}
        </svg>
        <div className="donut__center">
          {focus ? (
            <>
              <span className="donut__caption">{focus.label}</span>
              <span className="donut__value">{money(focus.value)}</span>
              <span className="donut__caption">{formatPercent(focus.share)} of spend</span>
            </>
          ) : (
            <>
              <span className="donut__caption">Spent in {monthLabel(month, 'short')}</span>
              <span className="donut__value">{money(total)}</span>
              <Delta ratio={change(total, prevTotal)} goodWhenUp={false} />
              <span className="donut__caption">{period.partial ? `vs same day in ${monthLabel(period.prevKey, 'short')}` : `vs ${monthLabel(period.prevKey, 'short')}`}</span>
            </>
          )}
        </div>
      </div>

      {insight && insight.ratio !== null && Math.abs(insight.delta) > 1 && (
        <p className="insight">
          <Sparkles size={15} aria-hidden />
          <span>
            {getCategory(insight.id).name} is {insight.delta > 0 ? 'up' : 'down'}{' '}
            <strong className={insight.delta > 0 ? 'text-neg' : 'text-pos'}>
              {/* Percentages past 2× stop meaning much; say the amount instead. */}
              {Math.abs(insight.ratio) < 2 ? formatPercent(Math.abs(insight.ratio), { decimals: 1 }) : money(Math.abs(insight.delta), { decimals: false })}
            </strong>{' '}
            vs {monthLabel(period.prevKey, 'short')}
          </span>
        </p>
      )}

      <ul className="legend" aria-label="Category totals">
        {EXPENSE_CATEGORIES.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`legend__item ${active && active !== c.id ? 'is-dim' : ''}`}
              onMouseEnter={() => setActive(c.id)}
              onFocus={() => setActive(c.id)}
              onBlur={() => setActive(null)}
            >
              <span className="legend__swatch" style={{ background: categoryColor(c.id) }} />
              <span className="legend__name">{c.name}</span>
              <span className="legend__value">{money(spend[c.id], { decimals: false })}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
