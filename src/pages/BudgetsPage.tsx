import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { budgetStatus, currentMonthKey, spendByCategory } from '../lib/finance'
import { monthLabel } from '../lib/dates'
import { toUSD, formatMoney } from '../lib/format'
import { getCategory, categoryColor } from '../data/categories'
import { CategoryIcon, IconButton, ProgressBar } from '../components/ui'
import { StatusTag } from '../components/BudgetsCard'
import type { Budget } from '../types'

function BudgetTile({ budget, spent, daysLeft }: { budget: Budget; spent: number; daysLeft: number }) {
  const { state, dispatch } = useFinance()
  const { money } = useDisplay()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const status = budgetStatus(spent, budget.limit)
  const left = budget.limit - spent
  const cat = getCategory(budget.categoryId)

  const startEdit = () => {
    setDraft(formatMoney(budget.limit, state.currency, { decimals: false }).replace(/[^\d]/g, ''))
    setEditing(true)
  }
  const save = () => {
    const v = Number(draft.replace(/,/g, ''))
    if (v > 0) dispatch({ type: 'setBudget', categoryId: budget.categoryId, limit: toUSD(v, state.currency) })
    setEditing(false)
  }

  return (
    <article className="card budget-tile">
      <header className="budget-tile__head">
        <span className="budget-tile__icon" style={{ ['--tile-accent' as string]: categoryColor(cat.id) }}>
          <CategoryIcon id={cat.id} size={18} />
        </span>
        <h3>{cat.name}</h3>
        <StatusTag status={status} />
      </header>
      <p className="budget-tile__spent">
        {money(spent, { decimals: false })}
        <span className="muted"> spent</span>
      </p>
      <ProgressBar value={spent / budget.limit} tone={status} label={`${cat.name} budget used`} />
      <div className="budget-tile__foot">
        {editing ? (
          <form
            className="inline-edit"
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <label className="sr-only" htmlFor={`limit-${cat.id}`}>
              Monthly limit for {cat.name} in {state.currency}
            </label>
            <input id={`limit-${cat.id}`} className="input input--sm" inputMode="numeric" value={draft} autoFocus onChange={(e) => setDraft(e.target.value.replace(/[^\d,]/g, ''))} />
            <IconButton label="Save limit" variant="solid" size="sm" type="submit">
              <Check size={15} />
            </IconButton>
          </form>
        ) : (
          <button type="button" className="limit-btn" onClick={startEdit}>
            Limit {money(budget.limit, { decimals: false })} <Pencil size={13} aria-hidden />
          </button>
        )}
        <span className={left < 0 ? 'text-neg' : 'muted'}>
          {left >= 0 ? `${money(left / Math.max(1, daysLeft), { decimals: false })}/day left` : `${money(-left, { decimals: false })} over`}
        </span>
      </div>
    </article>
  )
}

export function BudgetsPage() {
  const { state } = useFinance()
  const { money } = useDisplay()
  const key = currentMonthKey()
  const spend = spendByCategory(state.transactions, key)
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate() + 1
  const totalLimit = state.budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = state.budgets.reduce((s, b) => s + (spend[b.categoryId] ?? 0), 0)
  const status = budgetStatus(totalSpent, totalLimit)

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Budgets</h2>
          <p className="muted">
            {monthLabel(key)} · {daysLeft} days left
          </p>
        </div>
      </div>

      <section className="card budget-summary">
        <div>
          <p className="eyebrow">Spent of monthly budget</p>
          <p className="figure-lg">
            {money(totalSpent, { decimals: false })} <span className="muted figure-sub">/ {money(totalLimit, { decimals: false })}</span>
          </p>
        </div>
        <div className="budget-summary__meter">
          <ProgressBar value={totalSpent / totalLimit} tone={status} label="Total budget used" />
          <p className="muted">
            {totalLimit - totalSpent >= 0
              ? `${money(totalLimit - totalSpent, { decimals: false })} left — about ${money((totalLimit - totalSpent) / daysLeft, { decimals: false })} a day`
              : `${money(totalSpent - totalLimit, { decimals: false })} over budget`}
          </p>
        </div>
      </section>

      <div className="grid grid--tiles">
        {state.budgets.map((b) => (
          <BudgetTile key={b.categoryId} budget={b} spent={spend[b.categoryId] ?? 0} daysLeft={daysLeft} />
        ))}
      </div>
    </div>
  )
}
