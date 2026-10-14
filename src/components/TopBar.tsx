import { Bell, LayoutGrid, Moon, Plus, ArrowLeftRight, PiggyBank, Target, Search, Sun } from 'lucide-react'
import type { Page } from '../types'
import { IconButton } from './ui'
import { longDate, toISODate } from '../lib/dates'

export const NAV: { id: Page; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'goals', label: 'Goals', icon: Target },
]

interface TopBarProps {
  userName: string
  page: Page
  onNavigate: (page: Page) => void
  onAdd: () => void
  onSearch: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  pendingCount: number
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TopBar({ userName, page, onNavigate, onAdd, onSearch, theme, onToggleTheme, pendingCount }: TopBarProps) {
  const now = new Date()
  return (
    <header className="topbar">
      <div className="topbar__hello">
        <span className="avatar" aria-hidden>
          {userName.slice(0, 1)}
        </span>
        <div>
          <p className="topbar__date">{longDate(toISODate(now))}</p>
          <h1 className="topbar__title">
            {greeting(now.getHours())}, {userName}
          </h1>
        </div>
      </div>

      <nav className="nav-pills" aria-label="Primary">
        {NAV.map((n) => (
          <button key={n.id} type="button" className="nav-pills__item" aria-current={page === n.id ? 'page' : undefined} onClick={() => onNavigate(n.id)}>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="topbar__actions">
        <IconButton label="Search transactions" onClick={onSearch}>
          <Search size={18} />
        </IconButton>
        <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
        <button type="button" className="notif-pill" onClick={() => onNavigate('overview')} aria-label={`${pendingCount} items need review`} title="Items need review">
          <Bell size={18} />
          {pendingCount > 0 && <span className="notif-pill__dot" />}
          <span>{pendingCount}</span>
        </button>
        <button type="button" className="btn btn--primary topbar__add" onClick={onAdd}>
          <Plus size={18} strokeWidth={2.25} />
          <span>Add</span>
        </button>
      </div>
    </header>
  )
}

export function BottomNav({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV.map((n) => (
        <button key={n.id} type="button" className="bottom-nav__item" aria-current={page === n.id ? 'page' : undefined} onClick={() => onNavigate(n.id)}>
          <n.icon size={20} strokeWidth={1.9} aria-hidden />
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  )
}
