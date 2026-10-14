import { Building2, CreditCard, Landmark, LineChart, PiggyBank } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { accountBalance, totalBalance } from '../lib/finance'
import { CardHeader } from './ui'
import type { AccountType } from '../types'

const ICONS: Record<AccountType, typeof Landmark> = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  investment: LineChart,
}

export function AccountsCard() {
  const { state } = useFinance()
  const { money } = useDisplay()
  const assets = state.accounts.map((a) => accountBalance(a, state.transactions)).filter((b) => b > 0).reduce((s, b) => s + b, 0)

  return (
    <section className="card accounts" aria-labelledby="accounts-title">
      <CardHeader icon={<Building2 size={18} />} title="Accounts" subtitle={`Net worth ${money(totalBalance(state), { decimals: false })}`} />
      <span id="accounts-title" className="sr-only">
        Accounts
      </span>
      <ul className="account-list">
        {state.accounts.map((a) => {
          const Icon = ICONS[a.type]
          const bal = accountBalance(a, state.transactions)
          return (
            <li key={a.id} className="account">
              <span className="account__icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div className="account__main">
                <span className="account__name">{a.name}</span>
                <span className="account__meta">
                  {a.institution} •••• {a.last4}
                </span>
              </div>
              <div className="account__value">
                <span className={bal < 0 ? 'text-neg' : ''}>{money(bal)}</span>
                {bal > 0 && <span className="account__share">{Math.round((bal / assets) * 100)}% of assets</span>}
                {bal < 0 && <span className="account__share">Balance owed</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
