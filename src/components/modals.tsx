import { useState, type FormEvent } from 'react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'
import { toUSD } from '../lib/format'
import { toISODate } from '../lib/dates'
import { CategoryIcon, Modal, Segmented } from './ui'
import type { CategoryId, Currency } from '../types'

const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', LKR: 'Rs' }
const currencySymbol = (code: Currency) => SYMBOLS[code]

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/,/g, ''))
  return isFinite(n) ? n : NaN
}

export function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useFinance()
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId>('food')
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? '')
  const [today] = useState(() => toISODate(new Date()))
  const [date, setDate] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const categories = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const switchKind = (k: 'expense' | 'income') => {
    setKind(k)
    setCategoryId(k === 'expense' ? 'food' : 'salary')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = parseAmount(amount)
    if (!(value > 0)) return setError('Enter an amount greater than zero.')
    if (!merchant.trim()) return setError('Add who it was paid to or received from.')
    const usd = toUSD(value, state.currency)
    dispatch({
      type: 'addTransaction',
      txn: { date, merchant: merchant.trim(), amount: kind === 'expense' ? -usd : usd, categoryId, accountId, status: 'cleared' },
    })
    onClose()
  }

  return (
    <Modal
      title="Add transaction"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-txn" className="btn btn--primary">
            Save transaction
          </button>
        </>
      }
    >
      <form id="add-txn" className="form" onSubmit={submit} noValidate>
        <Segmented
          label="Transaction type"
          value={kind}
          onChange={switchKind}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
        />

        <label className="amount-field">
          <span className="sr-only">Amount in {state.currency}</span>
          <span className="amount-field__symbol" aria-hidden>
            {currencySymbol(state.currency)}
          </span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ''))
              setError(null)
            }}
            aria-invalid={!!error && !(parseAmount(amount) > 0)}
          />
          <span className="amount-field__code">{state.currency}</span>
        </label>

        <label className="field">
          <span className="field__label">{kind === 'expense' ? 'Paid to' : 'Received from'}</span>
          <input
            className="input"
            placeholder={kind === 'expense' ? 'e.g. Whole Foods' : 'e.g. Northwind Labs'}
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value)
              setError(null)
            }}
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">Category</legend>
          <div className="choice-grid">
            {categories.map((c) => (
              <label key={c.id} className="choice">
                <input type="radio" name="category" value={c.id} checked={categoryId === c.id} onChange={() => setCategoryId(c.id)} />
                <span className="choice__box">
                  <CategoryIcon id={c.id} size={16} />
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Account</span>
            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Date</span>
            <input className="input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

export function FundGoalModal({ onClose, goalId }: { onClose: () => void; goalId?: string }) {
  const { state, dispatch } = useFinance()
  const { money } = useDisplay()
  const [id, setId] = useState(goalId ?? state.goals[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const goal = state.goals.find((g) => g.id === id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = parseAmount(amount)
    if (!(value > 0)) return setError('Enter an amount greater than zero.')
    dispatch({ type: 'contributeGoal', id, amount: toUSD(value, state.currency) })
    onClose()
  }

  if (!state.goals.length) {
    return (
      <Modal title="Fund a goal" onClose={onClose}>
        <p className="muted">Create a goal first, then come back to add money to it.</p>
      </Modal>
    )
  }

  return (
    <Modal
      title="Fund a goal"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="fund-goal" className="btn btn--primary">
            Add to goal
          </button>
        </>
      }
    >
      <form id="fund-goal" className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field__label">Goal</span>
          <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
            {state.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        {goal && (
          <p className="muted">
            {money(goal.saved, { decimals: false })} saved of {money(goal.target, { decimals: false })} — {money(Math.max(0, goal.target - goal.saved), { decimals: false })} to go.
          </p>
        )}
        <label className="amount-field">
          <span className="sr-only">Amount in {state.currency}</span>
          <span className="amount-field__symbol" aria-hidden>
            {currencySymbol(state.currency)}
          </span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ''))
              setError(null)
            }}
          />
          <span className="amount-field__code">{state.currency}</span>
        </label>
        <div className="quick-amounts">
          {[50, 100, 250, 500].map((v) => (
            <button key={v} type="button" className="chip-btn" onClick={() => setAmount(String(v))}>
              +{v}
            </button>
          ))}
        </div>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

export function NewGoalModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useFinance()
  const [today] = useState(() => toISODate(new Date()))
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState(() => {
    const d = new Date()
    return toISODate(new Date(d.getFullYear() + 1, d.getMonth(), 1))
  })
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = parseAmount(target)
    if (!name.trim()) return setError('Give your goal a name.')
    if (!(value > 0)) return setError('Enter a target greater than zero.')
    dispatch({ type: 'addGoal', goal: { name: name.trim(), target: toUSD(value, state.currency), saved: 0, deadline } })
    onClose()
  }

  return (
    <Modal
      title="New goal"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="new-goal" className="btn btn--primary">
            Create goal
          </button>
        </>
      }
    >
      <form id="new-goal" className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field__label">Name</span>
          <input className="input" placeholder="e.g. Wedding fund" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field__label">Target ({state.currency})</span>
            <input className="input" inputMode="decimal" placeholder="5,000" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ''))} />
          </label>
          <label className="field">
            <span className="field__label">Target date</span>
            <input className="input" type="date" value={deadline} min={today} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
