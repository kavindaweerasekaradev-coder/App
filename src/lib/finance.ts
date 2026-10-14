import type { Account, CategoryId, FinanceState, Transaction } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'
import { lastMonths, monthKey, shiftMonth } from './dates'

export function accountBalance(account: Account, txns: Transaction[]): number {
  return txns.reduce((sum, t) => (t.accountId === account.id ? sum + t.amount : sum), account.openingBalance)
}

export function totalBalance(state: FinanceState): number {
  return state.accounts.reduce((sum, a) => sum + accountBalance(a, state.transactions), 0)
}

/** Transactions in a yyyy-mm month, optionally only up to (and including) a day of that month. */
export function inMonth(txns: Transaction[], key: string, uptoDay?: number): Transaction[] {
  return txns.filter((t) => t.date.startsWith(key) && (uptoDay === undefined || Number(t.date.slice(8, 10)) <= uptoDay))
}

/**
 * The fair comparison period for a month. The current month is still in
 * progress, so it is compared with the previous month up to the same day —
 * never a half month against a full one.
 */
export function comparisonPeriod(key: string, today = new Date()) {
  const partial = key === monthKey(today)
  return { prevKey: shiftMonth(key, -1), uptoDay: partial ? today.getDate() : undefined, partial }
}

export interface MonthTotals {
  key: string
  income: number
  expenses: number
  net: number
}

/** Refunds are counted as income here so the totals still balance. */
export function monthTotals(txns: Transaction[], key: string, uptoDay?: number): MonthTotals {
  let income = 0
  let expenses = 0
  for (const t of inMonth(txns, key, uptoDay)) {
    if (t.amount >= 0) income += t.amount
    else expenses += -t.amount
  }
  return { key, income, expenses, net: income - expenses }
}

export function cashFlowSeries(txns: Transaction[], months = 6, today = new Date()): MonthTotals[] {
  return lastMonths(months, today).map((k) => monthTotals(txns, k))
}

export function spendByCategory(txns: Transaction[], key: string, uptoDay?: number): Record<CategoryId, number> {
  const out = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>
  for (const t of inMonth(txns, key, uptoDay)) {
    if (t.amount < 0 && t.categoryId in out) out[t.categoryId] += -t.amount
  }
  return out
}

export function incomeBySource(txns: Transaction[], key: string) {
  const out = Object.fromEntries(INCOME_CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>
  for (const t of inMonth(txns, key)) {
    if (t.amount > 0 && t.categoryId in out) out[t.categoryId] += t.amount
  }
  return INCOME_CATEGORIES.map((c) => ({ category: c, amount: out[c.id] }))
}

export function change(current: number, previous: number): number | null {
  if (!previous) return null
  return (current - previous) / previous
}

/**
 * The single most useful sentence about this month's spending: the category
 * whose spend moved the most (in dollars) against last month.
 */
export function spendingInsight(txns: Transaction[], key: string) {
  const { prevKey, uptoDay } = comparisonPeriod(key)
  const now = spendByCategory(txns, key)
  const prev = spendByCategory(txns, prevKey, uptoDay)
  let best: { id: CategoryId; delta: number; ratio: number | null } | null = null
  for (const c of EXPENSE_CATEGORIES) {
    const delta = now[c.id] - prev[c.id]
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { id: c.id, delta, ratio: change(now[c.id], prev[c.id]) }
  }
  return best
}

export function currentMonthKey(today = new Date()) {
  return monthKey(today)
}

export type BudgetStatus = 'good' | 'warning' | 'critical'

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  const r = limit ? spent / limit : 0
  if (r > 1) return 'critical'
  if (r >= 0.85) return 'warning'
  return 'good'
}
