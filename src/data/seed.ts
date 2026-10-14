import type { Account, Budget, CategoryId, FinanceState, Goal, Transaction } from '../types'
import { toISODate } from '../lib/dates'

export const STATE_VERSION = 1

const ACCOUNTS: Account[] = [
  { id: 'chk', name: 'Everyday Checking', institution: 'Northbank', type: 'checking', last4: '4821', openingBalance: 14250 },
  { id: 'sav', name: 'High-yield Savings', institution: 'Northbank', type: 'savings', last4: '0937', openingBalance: 52400 },
  { id: 'inv', name: 'Brokerage', institution: 'Vanguard', type: 'investment', last4: '7714', openingBalance: 27980 },
  { id: 'cc', name: 'Travel Rewards Card', institution: 'Amex', type: 'credit', last4: '2210', openingBalance: 1450 },
]

const BUDGETS: Budget[] = [
  { categoryId: 'housing', limit: 2200 },
  { categoryId: 'food', limit: 850 },
  { categoryId: 'transport', limit: 320 },
  { categoryId: 'shopping', limit: 450 },
  { categoryId: 'entertainment', limit: 120 },
  { categoryId: 'other', limit: 200 },
]

/** Deterministic PRNG so the demo looks the same on every load. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Recurring {
  merchant: string
  categoryId: CategoryId
  accountId: string
  day: number
  min: number
  max: number
}

const MONTHLY: Recurring[] = [
  { merchant: 'Northwind Labs · Salary', categoryId: 'salary', accountId: 'chk', day: 1, min: 5000, max: 5000 },
  { merchant: 'Greenview Apartments', categoryId: 'housing', accountId: 'chk', day: 2, min: -1850, max: -1850 },
  { merchant: 'City Power & Water', categoryId: 'housing', accountId: 'chk', day: 9, min: -118, max: -164 },
  { merchant: 'Fibre Net', categoryId: 'housing', accountId: 'chk', day: 12, min: -59.99, max: -59.99 },
  { merchant: 'Vanguard · Dividends', categoryId: 'investments', accountId: 'inv', day: 15, min: 140, max: 320 },
  { merchant: 'Spotify', categoryId: 'entertainment', accountId: 'cc', day: 6, min: -10.99, max: -10.99 },
  { merchant: 'Metro Transit Pass', categoryId: 'transport', accountId: 'chk', day: 3, min: -89, max: -89 },
  { merchant: 'Pulse Fitness', categoryId: 'other', accountId: 'cc', day: 5, min: -49, max: -49 },
]

const SCATTERED: { merchants: string[]; categoryId: CategoryId; accountId: string; count: [number, number]; min: number; max: number }[] = [
  { merchants: ['Whole Foods', "Trader Joe's", 'Farmers Market'], categoryId: 'food', accountId: 'chk', count: [5, 7], min: 38, max: 142 },
  { merchants: ['Blue Bottle Coffee', 'Sweetgreen', 'Nando’s', 'Sushi Zen'], categoryId: 'food', accountId: 'cc', count: [4, 7], min: 9, max: 64 },
  { merchants: ['Uber', 'Shell'], categoryId: 'transport', accountId: 'chk', count: [2, 4], min: 14, max: 62 },
  { merchants: ['Amazon', 'Uniqlo', 'IKEA', 'Apple Store'], categoryId: 'shopping', accountId: 'chk', count: [2, 4], min: 24, max: 210 },
  { merchants: ['Cineplex', 'Steam', 'Live Nation'], categoryId: 'entertainment', accountId: 'cc', count: [1, 2], min: 14, max: 48 },
  { merchants: ['CVS Pharmacy', 'Barber & Co'], categoryId: 'other', accountId: 'chk', count: [1, 2], min: 18, max: 46 },
]

const FREELANCE = ['Studio Kite · Invoice', 'Brightlane · Invoice', 'Upwork']

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function buildTransactions(today: Date): Transaction[] {
  const rand = mulberry32(20261014)
  const between = (min: number, max: number) => round2(min + (max - min) * rand())
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const txns: Transaction[] = []
  let seq = 0
  const push = (t: Omit<Transaction, 'id' | 'status'> & { status?: Transaction['status'] }) => {
    txns.push({ status: 'cleared', ...t, id: `t${++seq}` })
  }

  for (let back = 5; back >= 0; back--) {
    const first = new Date(today.getFullYear(), today.getMonth() - back, 1)
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const lastDay = back === 0 ? today.getDate() : daysInMonth
    const at = (day: number) => toISODate(new Date(first.getFullYear(), first.getMonth(), Math.min(day, lastDay)))

    for (const r of MONTHLY) {
      if (r.day > lastDay) continue
      push({ date: at(r.day), merchant: r.merchant, amount: between(r.min, r.max), categoryId: r.categoryId, accountId: r.accountId })
    }

    // Freelance income grows over the period to give the cash-flow chart a story.
    const gigs = 1 + Math.floor(rand() * 2)
    for (let i = 0; i < gigs; i++) {
      const day = 8 + Math.floor(rand() * 18)
      if (day > lastDay) continue
      push({ date: at(day), merchant: pick(FREELANCE), amount: between(520 + (5 - back) * 60, 1150 + (5 - back) * 80), categoryId: 'freelance', accountId: 'chk' })
    }

    for (const s of SCATTERED) {
      // The current month is partial: scale the count to the days elapsed so far.
      const n = Math.round((s.count[0] + Math.floor(rand() * (s.count[1] - s.count[0] + 1))) * (lastDay / daysInMonth))
      for (let i = 0; i < n; i++) {
        const day = 1 + Math.floor(rand() * lastDay)
        push({ date: at(day), merchant: pick(s.merchants), amount: -between(s.min, s.max), categoryId: s.categoryId, accountId: s.accountId })
      }
    }
  }

  // A few hand-placed moments in the current month.
  const d = (offset: number) => toISODate(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - offset)))
  push({ date: d(1), merchant: 'Apple Store', amount: -249, categoryId: 'shopping', accountId: 'cc', note: 'AirPods' })
  push({ date: d(3), merchant: 'Google Play · Refund', amount: 120, categoryId: 'refunds', accountId: 'cc' })
  push({ date: d(0), merchant: 'Netflix', amount: -15.49, categoryId: 'entertainment', accountId: 'cc', status: 'pending', note: 'New recurring charge detected' })

  return txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function buildGoals(today: Date): Goal[] {
  const inMonths = (m: number) => toISODate(new Date(today.getFullYear(), today.getMonth() + m, 1))
  return [
    { id: 'g1', name: 'Emergency fund', target: 20000, saved: 12172.07, deadline: inMonths(8), savedThisMonth: 1100 },
    { id: 'g2', name: 'Japan trip', target: 6000, saved: 3480, deadline: inMonths(5), savedThisMonth: 600 },
    { id: 'g3', name: 'Home deposit', target: 60000, saved: 18500, deadline: inMonths(30), savedThisMonth: 1500 },
    { id: 'g4', name: 'New camera', target: 2400, saved: 640, deadline: inMonths(4), savedThisMonth: 0 },
  ]
}

export function createSeedState(today = new Date()): FinanceState {
  return {
    version: STATE_VERSION,
    userName: 'Alex',
    currency: 'USD',
    accounts: ACCOUNTS,
    transactions: buildTransactions(today),
    budgets: BUDGETS,
    goals: buildGoals(today),
  }
}
