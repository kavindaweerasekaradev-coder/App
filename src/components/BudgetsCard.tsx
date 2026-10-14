import { AlertTriangle, ArrowUpRight, CheckCircle2, OctagonAlert, PiggyBank } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { budgetStatus, currentMonthKey, spendByCategory, type BudgetStatus } from '../lib/finance'
import { getCategory } from '../data/categories'
import { CardHeader, CategoryIcon, IconButton, ProgressBar } from './ui'

export const STATUS_META: Record<BudgetStatus, { label: string; icon: typeof CheckCircle2 }> = {
  good: { label: 'On track', icon: CheckCircle2 },
  warning: { label: 'Near limit', icon: AlertTriangle },
  critical: { label: 'Over budget', icon: OctagonAlert },
}

export function StatusTag({ status }: { status: BudgetStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`status status--${status}`}>
      <meta.icon size={13} strokeWidth={2.25} aria-hidden />
      {meta.label}
    </span>
  )
}

export function BudgetsCard({ onOpen }: { onOpen: () => void }) {
  const { state } = useFinance()
  const { money } = useDisplay()
  const spend = spendByCategory(state.transactions, currentMonthKey())
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthElapsed = now.getDate() / daysInMonth

  const rows = state.budgets
    .map((b) => ({ ...b, spent: spend[b.categoryId] ?? 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 4)
  const totalLimit = state.budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = state.budgets.reduce((s, b) => s + (spend[b.categoryId] ?? 0), 0)

  return (
    <section className="card budgets" aria-labelledby="budgets-title">
      <CardHeader
        icon={<PiggyBank size={18} />}
        title="Budgets"
        subtitle={`${money(Math.max(0, totalLimit - totalSpent), { decimals: false })} left this month`}
        action={
          <IconButton label="Manage budgets" onClick={onOpen}>
            <ArrowUpRight size={18} />
          </IconButton>
        }
      />
      <span id="budgets-title" className="sr-only">
        Budgets
      </span>
      <ul className="budget-list">
        {rows.map((r) => {
          const status = budgetStatus(r.spent, r.limit)
          return (
            <li key={r.categoryId} className="budget-row">
              <div className="budget-row__head">
                <span className="budget-row__name">
                  <CategoryIcon id={r.categoryId} size={16} />
                  {getCategory(r.categoryId).name}
                </span>
                <StatusTag status={status} />
              </div>
              <div className="budget-row__meter">
                <ProgressBar value={r.spent / r.limit} tone={status} label={`${getCategory(r.categoryId).name} budget used`} />
                <span className="budget-row__pace" style={{ left: `${monthElapsed * 100}%` }} title="Where you'd be at an even pace" />
              </div>
              <p className="budget-row__nums">
                <strong>{money(r.spent, { decimals: false })}</strong> <span className="muted">of {money(r.limit, { decimals: false })}</span>
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
