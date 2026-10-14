import { ArrowRight, Flag, Percent, Sparkle } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { currentMonthKey, monthTotals } from '../lib/finance'
import { isOnTrack, monthlyNeeded, spotlightGoal } from '../lib/goals'
import { IconButton, ProgressBar } from './ui'

export function GoalSpotlight({ onOpenGoals }: { onOpenGoals: () => void }) {
  const { state } = useFinance()
  const { money } = useDisplay()
  const goal = spotlightGoal(state.goals)
  const month = monthTotals(state.transactions, currentMonthKey())
  const savingsRate = month.income > 0 ? Math.max(0, month.net / month.income) : 0
  const onTrack = state.goals.filter(isOnTrack).length

  return (
    <section className="card spotlight" aria-labelledby="spotlight-title">
      <svg className="spotlight__star" viewBox="0 0 200 200" aria-hidden>
        <path d="M100 0C108 62 138 92 200 100C138 108 108 138 100 200C92 138 62 108 0 100C62 92 92 62 100 0Z" />
      </svg>

      <div className="spotlight__top">
        <span className="badge-deep">
          TOP GOAL
          <span className="badge-deep__icon">
            <Sparkle size={14} fill="currentColor" />
          </span>
        </span>
        <IconButton label="Open goals" variant="solid" onClick={onOpenGoals}>
          <ArrowRight size={18} />
        </IconButton>
      </div>

      {goal ? (
        <div className="spotlight__body">
          <p className="spotlight__label" id="spotlight-title">
            {goal.name}
          </p>
          <div className="spotlight__figure">
            <p className="spotlight__amount">{money(goal.saved)}</p>
            {goal.savedThisMonth > 0 && <span className="pill-white">{money(goal.savedThisMonth, { signed: true, decimals: false })} this month</span>}
          </div>
          <ProgressBar value={goal.saved / goal.target} tone="deep" label={`${goal.name} progress`} />
          <p className="spotlight__meta">
            <strong>{Math.round((goal.saved / goal.target) * 100)}%</strong> of {money(goal.target, { decimals: false })} ·{' '}
            {money(monthlyNeeded(goal.target, goal.saved, goal.deadline), { decimals: false })}/mo to finish on time
          </p>
        </div>
      ) : (
        <div className="spotlight__body">
          <p className="spotlight__label" id="spotlight-title">
            No goals yet
          </p>
          <p className="spotlight__amount">Start saving</p>
        </div>
      )}

      <div className="spotlight__tiles">
        <div className="tile">
          <span className="tile__label">Savings rate</span>
          <span className="tile__value">
            <Percent size={16} aria-hidden /> {Math.round(savingsRate * 100)}%
          </span>
        </div>
        <div className="tile">
          <span className="tile__label">Goals on track</span>
          <span className="tile__value">
            <Flag size={16} aria-hidden /> {onTrack} of {state.goals.length}
          </span>
        </div>
      </div>
    </section>
  )
}
