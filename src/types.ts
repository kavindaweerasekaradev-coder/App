export type CategoryId =
  | 'housing'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'other'
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'refunds'

export type CategoryKind = 'expense' | 'income'

export interface Category {
  id: CategoryId
  name: string
  kind: CategoryKind
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment'

export interface Account {
  id: string
  name: string
  institution: string
  type: AccountType
  last4: string
  openingBalance: number
}

export type TransactionStatus = 'cleared' | 'pending'

export interface Transaction {
  id: string
  /** ISO date, yyyy-mm-dd */
  date: string
  merchant: string
  /** Signed amount in USD: negative is money out. */
  amount: number
  categoryId: CategoryId
  accountId: string
  status: TransactionStatus
  note?: string
}

export interface Budget {
  categoryId: CategoryId
  limit: number
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  /** ISO date, yyyy-mm-dd */
  deadline: string
  /** Amount saved in the current month, for the momentum pill. */
  savedThisMonth: number
}

export type Currency = 'USD' | 'EUR' | 'LKR'

export interface FinanceState {
  version: number
  userName: string
  currency: Currency
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
}

export type Page = 'overview' | 'transactions' | 'budgets' | 'goals'
