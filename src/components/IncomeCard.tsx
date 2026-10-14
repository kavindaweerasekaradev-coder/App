import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { cashFlowSeries, change, comparisonPeriod, currentMonthKey, incomeBySource, monthTotals } from '../lib/finance'
import { monthLabel, shiftMonth } from '../lib/dates'
import { CardHeader, Delta } from './ui'

export function IncomeCard() {
  const { state } = useFinance()
  const { money } = useDisplay()
  const key = currentMonthKey()
  const sources = incomeBySource(state.transactions, key)
  const total = sources.reduce((s, x) => s + x.amount, 0)
  const period = comparisonPeriod(key)
  const prev = monthTotals(state.transactions, period.prevKey, period.uptoDay).income
  const trend = cashFlowSeries(state.transactions, 6)
  const trendMax = Math.max(...trend.map((m) => m.income), 1)
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover !== null ? trend[hover] : null
  const avg = [1, 2, 3].reduce((s, i) => s + monthTotals(state.transactions, shiftMonth(key, -i)).income, 0) / 3
  const top = sources.reduce((a, b) => (b.amount > a.amount ? b : a), sources[0])

  return (
    <section className="card income" aria-labelledby="income-title">
      <CardHeader
        icon={<Wallet size={18} />}
        title="Income"
        action={
          <div className="target" title="Average monthly income over the last 3 months">
            <span className="target__label">
              3-mo avg <strong>{money(avg, { decimals: false })}</strong>
            </span>
            <span className="target__bar">
              <span style={{ width: `${Math.min(100, avg ? (total / avg) * 100 : 0)}%` }} />
            </span>
          </div>
        }
      />
      <span id="income-title" className="sr-only">
        Income this month
      </span>

      <div className="income__figure">
        <p className="figure-lg">{money(total)}</p>
        <p className="income__delta">
          <Delta ratio={change(total, prev)} /> <span className="muted">vs same day last month</span>
        </p>
      </div>

      <div className="mini-trend" onMouseLeave={() => setHover(null)}>
        <p className="mini-trend__label">
          {shown ? (
            <>
              {monthLabel(shown.key)} <strong>{money(shown.income, { decimals: false })}</strong>
            </>
          ) : (
            'Last 6 months'
          )}
        </p>
        <div className="mini-trend__bars" role="img" aria-label={`Income by month: ${trend.map((m) => `${monthLabel(m.key, 'short')} ${money(m.income, { decimals: false })}`).join(', ')}`}>
          {trend.map((m, i) => (
            <span key={m.key} className={`mini-trend__col ${i === trend.length - 1 ? 'is-current' : ''} ${hover === i ? 'is-hover' : ''}`} onMouseEnter={() => setHover(i)}>
              <span className="mini-trend__bar" style={{ height: `calc((100% - 20px) * ${Math.max(0.04, m.income / trendMax)})` }} />
              <span className="mini-trend__x">{monthLabel(m.key, 'short').slice(0, 1)}</span>
            </span>
          ))}
        </div>
      </div>

      <ul className="sources">
        {sources.map((s) => {
          const share = total ? s.amount / total : 0
          const isTop = s === top && s.amount > 0
          return (
            <li key={s.category.id} className="source">
              <div className="source__row">
                <span className="source__name">{s.category.name}</span>
                <span className="source__amount">{money(s.amount)}</span>
              </div>
              <div className={`source__track ${isTop ? 'is-top' : ''}`}>
                <span className="source__fill" style={{ width: `${Math.max(share * 100, s.amount ? 3 : 0)}%` }} />
                {isTop && (
                  <span className="source__badge" style={{ left: `${share * 100}%` }}>
                    {Math.round(share * 100)}%
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
