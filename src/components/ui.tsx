import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import {
  Briefcase,
  Car,
  Clapperboard,
  Home,
  PenTool,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId } from '../types'
import { categoryColor } from '../data/categories'

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  housing: Home,
  food: UtensilsCrossed,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  other: Receipt,
  salary: Briefcase,
  freelance: PenTool,
  investments: TrendingUp,
  refunds: RotateCcw,
}

export function CategoryIcon({ id, size = 18 }: { id: CategoryId; size?: number }) {
  const Icon = CATEGORY_ICONS[id]
  return <Icon size={size} strokeWidth={1.75} aria-hidden />
}

/** Round icon chip that carries the category's series colour as a small dot. */
export function TxnAvatar({ categoryId }: { categoryId: CategoryId }) {
  return (
    <span className="txn-avatar">
      <CategoryIcon id={categoryId} />
      <span className="txn-avatar__dot" style={{ background: categoryColor(categoryId) }} />
    </span>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
  variant?: 'ghost' | 'outline' | 'solid'
  size?: 'sm' | 'md'
}

export function IconButton({ label, children, variant = 'outline', size = 'md', className = '', ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn icon-btn--${variant} icon-btn--${size} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function CardHeader({ icon, title, action, subtitle }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="card__header">
      <span className="card__icon" aria-hidden>
        {icon}
      </span>
      <div className="card__titles">
        <h2 className="card__title">{title}</h2>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card__action">{action}</div>}
    </header>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: ReactNode; ariaLabel?: string }[]
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.ariaLabel}
          className="segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.modal__close)')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}>
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" variant="ghost" className="modal__close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}

export function ProgressBar({ value, tone = 'brand', label }: { value: number; tone?: 'brand' | 'good' | 'warning' | 'critical' | 'deep'; label: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`progress progress--${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <span className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Delta({ ratio, goodWhenUp = true, suffix }: { ratio: number | null; goodWhenUp?: boolean; suffix?: string }) {
  if (ratio === null || !isFinite(ratio)) return null
  const up = ratio >= 0
  const good = up === goodWhenUp
  return (
    <span className={`delta ${good ? 'delta--good' : 'delta--bad'}`}>
      {up ? '↑' : '↓'} {Math.abs(ratio * 100).toFixed(1)}%{suffix && <span className="delta__suffix"> {suffix}</span>}
    </span>
  )
}
