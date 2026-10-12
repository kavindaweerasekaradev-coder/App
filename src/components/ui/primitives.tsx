import type { HTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cx } from '@/lib/format'

export function Card({ className, as: As = 'div', ...rest }: HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('card', className)} {...rest} />
}

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  primary: 'bg-primary-soft text-primary-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent text-accent-fg',
}

export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
  dot,
}: {
  tone?: Tone
  icon?: LucideIcon
  children: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span className={cx('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-caption font-semibold', toneClass[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {Icon && <Icon size={13} strokeWidth={2.2} aria-hidden />}
      {children}
    </span>
  )
}

export function SectionHeader({ title, action, to, onAction, id }: { title: string; action?: string; to?: string; onAction?: () => void; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-title font-bold text-ink">
        {title}
      </h2>
      {action && to && (
        <Link to={to} className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-small font-semibold text-primary-ink hover:bg-primary-soft">
          {action}
          <ChevronRight size={16} aria-hidden />
        </Link>
      )}
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-small font-semibold text-primary-ink hover:bg-primary-soft"
        >
          {action}
          <ChevronRight size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}

export function Stat({ label, value, unit, icon: Icon, className }: { label: string; value: ReactNode; unit?: string; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="flex items-center gap-1.5 text-small text-ink-2">
        {Icon && <Icon size={15} strokeWidth={1.9} aria-hidden className="shrink-0 text-ink-3" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="tabular mt-1 truncate text-title font-bold text-ink">
        {value}
        {unit && <span className="ml-1 text-small font-semibold text-ink-2">{unit}</span>}
      </div>
    </div>
  )
}

export function ProgressBar({
  value,
  max = 100,
  marker,
  tone = 'primary',
  label,
  className,
  height = 'h-2',
}: {
  value: number
  max?: number
  marker?: number
  tone?: 'primary' | 'accent' | 'warning' | 'danger'
  label: string
  className?: string
  height?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const fill = { primary: 'bg-primary', accent: 'bg-accent', warning: 'bg-warning', danger: 'bg-danger' }[tone]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cx('relative w-full overflow-hidden rounded-full bg-surface-2', height, className)}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-700 ease-out', fill)} style={{ width: `${pct}%` }} />
      {marker !== undefined && <div className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${(marker / max) * 100}%` }} aria-hidden />}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded bg-surface-2', className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-ink/[0.04] to-transparent" />
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-line', className)} />
}

export function Notice({
  icon: Icon,
  children,
  tone = 'neutral',
  className,
}: {
  icon: LucideIcon
  children: ReactNode
  tone?: 'neutral' | 'warning'
  className?: string
}) {
  return (
    <p className={cx('flex gap-2 rounded px-3 py-2.5 text-small', tone === 'neutral' ? 'bg-surface-2 text-ink-2' : 'bg-warning-soft text-warning', className)}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
