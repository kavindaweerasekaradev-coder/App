import type { Goal } from '../types'
import { monthsUntil } from './dates'

/** Monthly amount needed from today to hit the goal by its deadline. */
export function monthlyNeeded(target: number, saved: number, deadline: string) {
  const months = Math.max(1, monthsUntil(deadline))
  return Math.max(0, (target - saved) / months)
}

/** On track when this month's contribution covers (most of) what the plan needed at the start of the month. */
export function isOnTrack(g: Goal) {
  return g.saved >= g.target || g.savedThisMonth >= monthlyNeeded(g.target, g.saved - g.savedThisMonth, g.deadline) * 0.9
}

/** The goal worth celebrating: the unfinished one closest to done. */
export function spotlightGoal(goals: Goal[]): Goal | undefined {
  const open = goals.filter((g) => g.saved < g.target)
  return [...(open.length ? open : goals)].sort((a, b) => b.saved / b.target - a.saved / a.target)[0]
}
