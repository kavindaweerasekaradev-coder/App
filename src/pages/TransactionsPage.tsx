import { useMemo, useState, type RefObject } from 'react'
import { Plus, Search, SearchX } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { CATEGORIES } from '../data/categories'
import { lastMonths, longDate, monthLabel } from '../lib/dates'
import { Segmented } from '../components/ui'
import { TransactionRow } from '../components/TransactionsCard'
import type { CategoryId, Transaction } from '../types'

type Flow = 'all' | 'in' | 'out'

export function TransactionsPage({ onAdd, searchRef }: { onAdd: () => void; searchRef: RefObject<HTMLInputElement | null> }) {
  const { state, dispatch } = useFinance()
  const { money } = useDisplay()
  const [query, setQuery] = useState('')
  const [flow, setFlow] = useState<Flow>('all')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [month, setMonth] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.transactions.filter(
      (t) =>
        (flow === 'all' || (flow === 'in' ? t.amount > 0 : t.amount < 0)) &&
        (category === 'all' || t.categoryId === category) &&
        (month === 'all' || t.date.startsWith(month)) &&
        (!q || t.merchant.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q)),
    )
  }, [state.transactions, query, flow, category, month])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return [...map.entries()]
  }, [filtered])

  const totalIn = filtered.reduce((s, t) => (t.amount > 0 ? s + t.amount : s), 0)
  const totalOut = filtered.reduce((s, t) => (t.amount < 0 ? s - t.amount : s), 0)
  const filtersOn = query || flow !== 'all' || category !== 'all' || month !== 'all'

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Transactions</h2>
          <p className="muted">
            {filtered.length} transactions · <span className="text-pos">{money(totalIn, { signed: true, decimals: false })}</span> in ·{' '}
            {money(-totalOut, { decimals: false })} out
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          <Plus size={17} strokeWidth={2.25} /> Add transaction
        </button>
      </div>

      <div className="filters card">
        <label className="search">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search transactions</span>
          <input ref={searchRef} type="search" placeholder="Search merchants or notes" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <Segmented<Flow>
          label="Direction"
          value={flow}
          onChange={setFlow}
          options={[
            { value: 'all', label: 'All' },
            { value: 'in', label: 'In' },
            { value: 'out', label: 'Out' },
          ]}
        />
        <label className="select-pill">
          <span className="sr-only">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="select-pill">
          <span className="sr-only">Month</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {lastMonths(6)
              .reverse()
              .map((k) => (
                <option key={k} value={k}>
                  {monthLabel(k)}
                </option>
              ))}
          </select>
        </label>
        {filtersOn && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setQuery('')
              setFlow('all')
              setCategory('all')
              setMonth('all')
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="card ledger">
        {groups.length === 0 ? (
          <div className="empty">
            <SearchX size={28} aria-hidden />
            <p>No transactions match these filters.</p>
          </div>
        ) : (
          groups.map(([date, txns]) => {
            const dayNet = txns.reduce((s, t) => s + t.amount, 0)
            return (
              <section key={date} className="ledger__day">
                <header className="ledger__date">
                  <span>{longDate(date)}</span>
                  <span>{money(dayNet, { signed: true })}</span>
                </header>
                <ul className="txn-list">
                  {txns.map((t) => (
                    <li key={t.id} className={t.status === 'pending' ? 'is-pending' : ''}>
                      <TransactionRow txn={t} onDelete={() => dispatch({ type: 'deleteTransaction', id: t.id })} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
