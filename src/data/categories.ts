import type { Category, CategoryId } from '../types'

/**
 * Expense categories are listed in their fixed chart order. The colour slots
 * (--cat-1 … --cat-5, then the neutral --cat-other) were validated for
 * colour-vision deficiency as adjacent pairs in this exact order, so the
 * donut ring must keep it — never sort segments by size.
 */
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing', kind: 'expense' },
  { id: 'food', name: 'Food & dining', kind: 'expense' },
  { id: 'transport', name: 'Transport', kind: 'expense' },
  { id: 'shopping', name: 'Shopping', kind: 'expense' },
  { id: 'entertainment', name: 'Entertainment', kind: 'expense' },
  { id: 'other', name: 'Other', kind: 'expense' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', kind: 'income' },
  { id: 'freelance', name: 'Freelance', kind: 'income' },
  { id: 'investments', name: 'Investments', kind: 'income' },
  { id: 'refunds', name: 'Refunds', kind: 'income' },
]

export const CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: CategoryId): Category {
  return byId.get(id)!
}

const SERIES_VAR: Partial<Record<CategoryId, string>> = {
  housing: 'var(--cat-1)',
  food: 'var(--cat-2)',
  transport: 'var(--cat-3)',
  shopping: 'var(--cat-4)',
  entertainment: 'var(--cat-5)',
  other: 'var(--cat-other)',
}

export function categoryColor(id: CategoryId): string {
  return SERIES_VAR[id] ?? 'var(--brand-strong)'
}
