import { ArrowUpRight, Check, ReceiptText, X } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { relativeDay } from '../lib/dates'
import { getCategory } from '../data/categories'
import { IconButton, TxnAvatar } from './ui'
import type { Transaction } from '../types'

export function TransactionRow({ txn, onDelete }: { txn: Transaction; onDelete?: () => void }) {
  const { state } = useFinance()
  const { money } = useDisplay()
  const account = state.accounts.find((a) => a.id === txn.accountId)
  return (
    <div className="txn">
      <TxnAvatar categoryId={txn.categoryId} />
      <div className="txn__main">
        <span className="txn__merchant">{txn.merchant}</span>
        <span className="txn__meta">
          {relativeDay(txn.date)} · {getCategory(txn.categoryId).name}
          {account && <span className="txn__account"> · {account.name}</span>}
        </span>
      </div>
      <span className={`txn__amount ${txn.amount >= 0 ? 'text-pos' : ''}`}>{money(txn.amount, { signed: true })}</span>
      {onDelete && (
        <IconButton label={`Delete ${txn.merchant}`} variant="ghost" size="sm" className="txn__delete" onClick={onDelete}>
          <X size={15} />
        </IconButton>
      )}
    </div>
  )
}

export function TransactionsCard({ onOpenAll }: { onOpenAll: () => void }) {
  const { state, dispatch } = useFinance()
  const { money } = useDisplay()
  const pending = state.transactions.filter((t) => t.status === 'pending')
  const recent = state.transactions.filter((t) => t.status === 'cleared').slice(0, 6 - Math.min(pending.length, 2))

  return (
    <section className="card transactions" aria-labelledby="txn-title">
      <header className="card__header">
        <span className="card__icon" aria-hidden>
          <ReceiptText size={18} />
        </span>
        <div className="card__titles">
          <h2 className="card__title" id="txn-title">
            Transactions
          </h2>
        </div>
        <div className="card__action">
          <IconButton label="See all transactions" onClick={onOpenAll}>
            <ArrowUpRight size={18} />
          </IconButton>
        </div>
      </header>

      {pending.slice(0, 2).map((t) => (
        <div key={t.id} className="review" role="group" aria-label={`Review ${t.merchant}`}>
          <TxnAvatar categoryId={t.categoryId} />
          <div className="txn__main">
            <span className="txn__merchant">
              {t.merchant} <span className="review__amount">{money(t.amount)}</span>
            </span>
            <span className="review__note">{t.note ?? 'Pending · needs review'}</span>
          </div>
          <div className="review__actions">
            <IconButton label={`Approve ${t.merchant}`} variant="solid" className="review__ok" onClick={() => dispatch({ type: 'approveTransaction', id: t.id })}>
              <Check size={17} strokeWidth={2.5} />
            </IconButton>
            <IconButton label={`Dismiss ${t.merchant}`} onClick={() => dispatch({ type: 'deleteTransaction', id: t.id })}>
              <X size={16} />
            </IconButton>
          </div>
        </div>
      ))}

      <ul className="txn-list">
        {recent.map((t) => (
          <li key={t.id}>
            <TransactionRow txn={t} />
          </li>
        ))}
      </ul>
    </section>
  )
}
