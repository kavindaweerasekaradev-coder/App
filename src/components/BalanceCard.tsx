import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Eye, EyeOff, PiggyBank, Plus } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { CURRENCIES, splitMoney } from '../lib/format'
import { currentMonthKey, monthTotals, totalBalance } from '../lib/finance'
import { IconButton, Segmented } from './ui'
import type { Currency } from '../types'

interface Props {
  onAdd: () => void
  onFundGoal: () => void
  onOpenActivity: () => void
}

export function BalanceCard({ onAdd, onFundGoal, onOpenActivity }: Props) {
  const { state, dispatch } = useFinance()
  const { hidden, toggleHidden, money } = useDisplay()
  const [copied, setCopied] = useState(false)

  const balance = totalBalance(state)
  const { whole, cents } = splitMoney(balance, state.currency)
  const thisMonth = monthTotals(state.transactions, currentMonthKey())
  const primary = state.accounts[0]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${primary.institution} ${primary.last4}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  }

  return (
    <section className="card balance" aria-labelledby="balance-label">
      <div className="balance__top">
        <Segmented<Currency>
          label="Display currency"
          value={state.currency}
          onChange={(currency) => dispatch({ type: 'setCurrency', currency })}
          options={CURRENCIES.map((c) => ({
            value: c.code,
            ariaLabel: c.label,
            label: (
              <>
                <span className="flag" aria-hidden>
                  {c.flag}
                </span>
                {c.code}
              </>
            ),
          }))}
        />
        <div className="balance__account">
          <span className="eyebrow">Primary account</span>
          <button type="button" className="balance__acct-number" onClick={copy} aria-label="Copy account reference">
            <span>
              {primary.institution} •••• {primary.last4}
            </span>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      <div className="balance__body">
        <p className="eyebrow" id="balance-label">
          Total balance · {state.accounts.length} accounts
        </p>
        <div className="balance__figure">
          <p className="hero-number" aria-live="polite">
            {hidden ? (
              '••••••'
            ) : (
              <>
                {whole}
                <span className="hero-number__cents">{cents}</span>
              </>
            )}
          </p>
          <IconButton label={hidden ? 'Show balances' : 'Hide balances'} variant="solid" size="sm" onClick={toggleHidden}>
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        </div>
        <p className="balance__delta">
          <span className={`chip ${thisMonth.net >= 0 ? 'chip--pos' : 'chip--neg'}`}>{money(thisMonth.net, { signed: true })}</span>
          <span className="muted">net this month</span>
        </p>
      </div>

      <div className="balance__footer">
        <div className="balance__actions">
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            <Plus size={17} strokeWidth={2.25} /> Add transaction
          </button>
          <button type="button" className="btn btn--outline" onClick={onFundGoal}>
            <PiggyBank size={16} /> Fund a goal
          </button>
        </div>
        <button type="button" className="fab" onClick={onOpenActivity} aria-label="Open all transactions">
          <ArrowUpRight size={30} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  )
}
