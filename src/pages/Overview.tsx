import { BalanceCard } from '../components/BalanceCard'
import { GoalSpotlight } from '../components/GoalSpotlight'
import { SpendingCard } from '../components/SpendingCard'
import { IncomeCard } from '../components/IncomeCard'
import { TransactionsCard } from '../components/TransactionsCard'
import { CashFlowCard } from '../components/CashFlowCard'
import { BudgetsCard } from '../components/BudgetsCard'
import { AccountsCard } from '../components/AccountsCard'
import type { Page } from '../types'

interface Props {
  onNavigate: (p: Page) => void
  onAdd: () => void
  onFundGoal: () => void
}

export function Overview({ onNavigate, onAdd, onFundGoal }: Props) {
  return (
    <div className="grid grid--overview">
      <BalanceCard onAdd={onAdd} onFundGoal={onFundGoal} onOpenActivity={() => onNavigate('transactions')} />
      <GoalSpotlight onOpenGoals={() => onNavigate('goals')} />
      <SpendingCard />
      <IncomeCard />
      <TransactionsCard onOpenAll={() => onNavigate('transactions')} />
      <CashFlowCard />
      <BudgetsCard onOpen={() => onNavigate('budgets')} />
      <AccountsCard />
    </div>
  )
}
