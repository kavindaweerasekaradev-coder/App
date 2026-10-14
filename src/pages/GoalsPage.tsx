import { AlertTriangle, CalendarDays, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useFinance } from '../state/store'
import { useDisplay } from '../state/display'
import { parseISODate } from '../lib/dates'
import { IconButton, ProgressBar } from '../components/ui'
import { isOnTrack, monthlyNeeded } from '../lib/goals'

export function GoalsPage({ onNewGoal, onFund }: { onNewGoal: () => void; onFund: (id: string) => void }) {
  const { state, dispatch } = useFinance()
  const { money } = useDisplay()
  const saved = state.goals.reduce((s, g) => s + g.saved, 0)
  const target = state.goals.reduce((s, g) => s + g.target, 0)

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Goals</h2>
          <p className="muted">
            {money(saved, { decimals: false })} saved toward {money(target, { decimals: false })} across {state.goals.length} goals
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNewGoal}>
          <Plus size={17} strokeWidth={2.25} /> New goal
        </button>
      </div>

      <div className="grid grid--tiles">
        {state.goals.map((g) => {
          const pct = g.saved / g.target
          const done = g.saved >= g.target
          const track = isOnTrack(g)
          return (
            <article key={g.id} className={`card goal ${done ? 'goal--done' : ''}`}>
              <header className="goal__head">
                <h3>{g.name}</h3>
                <IconButton label={`Delete ${g.name}`} variant="ghost" size="sm" onClick={() => dispatch({ type: 'deleteGoal', id: g.id })}>
                  <Trash2 size={15} />
                </IconButton>
              </header>
              <p className="goal__amount">
                {money(g.saved, { decimals: false })} <span className="muted">of {money(g.target, { decimals: false })}</span>
              </p>
              <ProgressBar value={pct} tone={done ? 'good' : 'brand'} label={`${g.name} progress`} />
              <div className="goal__meta">
                <span>
                  <CalendarDays size={14} aria-hidden /> {parseISODate(g.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span className={`status status--${done || track ? 'good' : 'warning'}`}>
                  {done || track ? <CheckCircle2 size={13} strokeWidth={2.25} aria-hidden /> : <AlertTriangle size={13} strokeWidth={2.25} aria-hidden />}
                  {done ? 'Completed' : track ? 'On track' : 'Behind'}
                </span>
              </div>
              {!done && (
                <p className="goal__hint muted">
                  Save {money(monthlyNeeded(g.target, g.saved, g.deadline), { decimals: false })}/month to reach it on time.
                </p>
              )}
              <button type="button" className="btn btn--soft goal__cta" onClick={() => onFund(g.id)} disabled={done}>
                <Plus size={16} /> Add money
              </button>
            </article>
          )
        })}
        <button type="button" className="card goal-new" onClick={onNewGoal}>
          <span className="goal-new__icon">
            <Plus size={22} />
          </span>
          Create a new goal
        </button>
      </div>
    </div>
  )
}
