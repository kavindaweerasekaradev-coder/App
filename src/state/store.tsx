import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import type { CategoryId, Currency, FinanceState, Goal, Transaction } from '../types'
import { createSeedState, STATE_VERSION } from '../data/seed'

const STORAGE_KEY = 'ledgr:state'

type Action =
  | { type: 'addTransaction'; txn: Omit<Transaction, 'id'> }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'approveTransaction'; id: string }
  | { type: 'setBudget'; categoryId: CategoryId; limit: number }
  | { type: 'addGoal'; goal: Omit<Goal, 'id' | 'savedThisMonth'> }
  | { type: 'contributeGoal'; id: string; amount: number }
  | { type: 'deleteGoal'; id: string }
  | { type: 'setCurrency'; currency: Currency }
  | { type: 'reset' }

const uid = () => Math.random().toString(36).slice(2, 10)

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'addTransaction': {
      const txn = { ...action.txn, id: uid() }
      const transactions = [txn, ...state.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      return { ...state, transactions }
    }
    case 'deleteTransaction':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }
    case 'approveTransaction':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, status: 'cleared', note: undefined } : t)),
      }
    case 'setBudget': {
      const exists = state.budgets.some((b) => b.categoryId === action.categoryId)
      const budgets = exists
        ? state.budgets.map((b) => (b.categoryId === action.categoryId ? { ...b, limit: action.limit } : b))
        : [...state.budgets, { categoryId: action.categoryId, limit: action.limit }]
      return { ...state, budgets }
    }
    case 'addGoal':
      return { ...state, goals: [...state.goals, { ...action.goal, id: uid(), savedThisMonth: action.goal.saved }] }
    case 'contributeGoal':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, saved: g.saved + action.amount, savedThisMonth: g.savedThisMonth + action.amount } : g,
        ),
      }
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }
    case 'setCurrency':
      return { ...state, currency: action.currency }
    case 'reset':
      return createSeedState()
  }
}

function load(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState
      if (parsed.version === STATE_VERSION) return parsed
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data); fall back to the demo data.
  }
  return createSeedState()
}

interface Store {
  state: FinanceState
  dispatch: Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Not persisting is acceptable; the session still works in memory.
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useFinance(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>')
  return ctx
}
