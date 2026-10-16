import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { FinanceProvider, useFinance } from './state/store'
import { DisplayProvider } from './state/display'
import { useTheme } from './hooks/useTheme'
import { TopBar, BottomNav } from './components/TopBar'
import { AddTransactionModal, FundGoalModal, NewGoalModal } from './components/modals'
import { Overview } from './pages/Overview'
import { TransactionsPage } from './pages/TransactionsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { GoalsPage } from './pages/GoalsPage'
import type { Page } from './types'

// Three.js + GSAP only load when someone actually plays the tour.
const Showcase = lazy(() => import('./showcase/Showcase'))

type Dialog = { kind: 'add' } | { kind: 'fund'; goalId?: string } | { kind: 'newGoal' } | null

const PAGES: Page[] = ['overview', 'transactions', 'budgets', 'goals']

function pageFromHash(): Page {
  const h = window.location.hash.replace('#/', '') as Page
  return PAGES.includes(h) ? h : 'overview'
}

function Shell() {
  const { state, dispatch } = useFinance()
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState<Page>(pageFromHash)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [touring, setTouring] = useState(() => window.location.hash === '#/tour')
  const searchRef = useRef<HTMLInputElement>(null)
  const focusSearch = useRef(false)

  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash())
      if (window.location.hash === '#/tour') setTouring(true)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((p: Page) => {
    window.location.hash = `/${p}`
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (page === 'transactions' && focusSearch.current) {
      focusSearch.current = false
      searchRef.current?.focus()
    }
  }, [page])

  const openSearch = () => {
    if (page === 'transactions') searchRef.current?.focus()
    else {
      focusSearch.current = true
      navigate('transactions')
    }
  }

  const close = useCallback(() => setDialog(null), [])
  const pending = state.transactions.filter((t) => t.status === 'pending').length

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar
        userName={state.userName}
        page={page}
        onNavigate={navigate}
        onAdd={() => setDialog({ kind: 'add' })}
        onSearch={openSearch}
        theme={theme}
        onToggleTheme={toggle}
        pendingCount={pending}
      />

      <main id="main" className="main" key={page}>
        {page === 'overview' && <Overview onNavigate={navigate} onAdd={() => setDialog({ kind: 'add' })} onFundGoal={() => setDialog({ kind: 'fund' })} />}
        {page === 'transactions' && <TransactionsPage onAdd={() => setDialog({ kind: 'add' })} searchRef={searchRef} />}
        {page === 'budgets' && <BudgetsPage />}
        {page === 'goals' && <GoalsPage onNewGoal={() => setDialog({ kind: 'newGoal' })} onFund={(goalId) => setDialog({ kind: 'fund', goalId })} />}
      </main>

      <footer className="app-footer">
        <span>Ledgr · demo data is stored only in this browser.</span>
        <div className="app-footer__actions">
          <button type="button" className="btn btn--soft btn--sm" onClick={() => (window.location.hash = '#/tour')}>
            <Play size={13} fill="currentColor" /> Watch the tour
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'reset' })}>
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </footer>

      <BottomNav page={page} onNavigate={navigate} />

      {dialog?.kind === 'add' && <AddTransactionModal onClose={close} />}
      {dialog?.kind === 'fund' && <FundGoalModal onClose={close} goalId={dialog.goalId} />}
      {dialog?.kind === 'newGoal' && <NewGoalModal onClose={close} />}

      {touring && (
        <Suspense fallback={<div className="tour-loading" aria-label="Loading tour" />}>
          <Showcase
            onExit={() => {
              setDialog(null)
              setTouring(false)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  return (
    <FinanceProvider>
      <DisplayProvider>
        <Shell />
      </DisplayProvider>
    </FinanceProvider>
  )
}
