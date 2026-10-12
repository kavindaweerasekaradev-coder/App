import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChartColumn, House, MapPin, Route, UserRound, Zap } from 'lucide-react'
import { useApp } from '@/state/AppState'
import { cx } from '@/lib/format'
import { IconButton } from '@/components/ui/Button'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Charge', icon: MapPin },
  { to: '/journey', label: 'Journey', icon: Route },
  { to: '/insights', label: 'Insights', icon: ChartColumn },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path d="M9 9l7 14 7-14" fill="none" stroke="#C8F24A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-title font-extrabold tracking-tight">Velora</span>
    </span>
  )
}

export function AppShell() {
  const { session } = useApp()
  const { pathname } = useLocation()
  const fullBleed = pathname === '/explore'

  return (
    <div className="min-h-dvh md:flex">
      {/* Side rail — tablet & desktop */}
      <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col items-center border-r border-line bg-surface py-5 md:flex lg:w-60 lg:items-stretch lg:px-4">
        <div className="mb-8 lg:px-2">
          <span className="lg:hidden">
            <svg viewBox="0 0 32 32" className="h-9 w-9" aria-label="Velora">
              <rect width="32" height="32" rx="9" className="fill-primary" />
              <path d="M9 9l7 14 7-14" fill="none" stroke="#C8F24A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <Logo className="hidden lg:inline-flex" />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex h-12 items-center gap-3 rounded-full px-3.5 text-body font-semibold transition-colors',
                  isActive ? 'bg-primary text-primary-fg' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden />
              <span className="sr-only lg:not-sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>
        {session && (
          <NavLink to="/charging" className="mt-auto flex items-center gap-3 rounded-lg bg-primary-soft p-3 text-primary-ink hover:bg-primary-soft/70">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-accent">
              <Zap size={18} aria-hidden />
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className="block text-small font-bold">{session.status === 'charging' ? 'Charging' : 'Session ended'}</span>
              <span className="tabular block text-caption">{Math.round(session.pct)}% · view session</span>
            </span>
            <span className="sr-only lg:hidden">Charging session</span>
          </NavLink>
        )}
      </aside>

      <main id="main" className={cx('min-w-0 flex-1', !fullBleed && 'pb-28 md:pb-10')}>
        <Outlet />
      </main>

      {/* Floating bottom bar — phones */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-full bg-ink p-1.5 shadow-float dark:bg-surface dark:ring-1 dark:ring-line">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-semibold transition-colors',
                  isActive ? 'bg-accent text-accent-fg' : 'text-white/70 hover:text-white dark:text-ink-2 dark:hover:text-ink',
                )
              }
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  className,
}: {
  title: string
  subtitle?: string
  back?: boolean | string
  actions?: ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <header className={cx('flex items-center gap-3 pb-4 pt-5', className)}>
      {back && (
        <IconButton
          icon={ArrowLeft}
          label="Back"
          onClick={() => (typeof back === 'string' ? navigate(back) : window.history.length > 1 ? navigate(-1) : navigate('/'))}
        />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-headline font-bold">{title}</h1>
        {subtitle && <p className="truncate text-small text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cx('mx-auto w-full px-4 sm:px-6', wide ? 'max-w-app' : 'max-w-3xl', className)}>{children}</div>
}
