import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown, CircleAlert, type LucideIcon } from 'lucide-react'
import { cx } from '@/lib/format'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  id: string
  children: ReactNode
  hideLabel?: boolean
}

function FieldShell({ label, hint, error, id, children, hideLabel }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cx('text-small font-semibold text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="flex items-center gap-1.5 text-small text-danger" role="alert">
          <CircleAlert size={14} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-small text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const fieldBase =
  'h-12 w-full rounded bg-surface px-4 text-body text-ink ring-1 ring-inset ring-line placeholder:text-ink-3 transition-shadow hover:ring-ink-3/60 focus:outline-none focus:ring-2 focus:ring-primary-ink'

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; icon?: LucideIcon; suffix?: string; hideLabel?: boolean }
>(function TextField({ label, hint, error, icon: Icon, suffix, hideLabel, className, id, ...rest }, ref) {
  const autoId = useId()
  const fid = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={fid} hideLabel={hideLabel}>
      <div className="relative">
        {Icon && <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fid}-msg` : undefined}
          className={cx(fieldBase, Icon && 'pl-11', suffix && 'pr-16', error && 'ring-2 ring-danger hover:ring-danger', className)}
          {...rest}
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-small font-semibold text-ink-3">{suffix}</span>}
      </div>
    </FieldShell>
  )
})

export function SelectField({
  label,
  hint,
  error,
  children,
  className,
  id,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string }) {
  const autoId = useId()
  const fid = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={fid}>
      <div className="relative">
        <select
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fid}-msg` : undefined}
          className={cx(fieldBase, 'appearance-none pr-10', error && 'ring-2 ring-danger', className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
      </div>
    </FieldShell>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => `${v}%`,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  hint?: string
}) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-small font-semibold text-ink">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-title font-bold text-ink">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="velora-range h-6 w-full cursor-pointer appearance-none bg-transparent"
        style={{ ['--fill' as string]: `${pct}%` }}
        aria-valuetext={format(value)}
      />
      {hint && <p className="text-small text-ink-3">{hint}</p>}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  id?: string
}) {
  const autoId = useId()
  const sid = id ?? autoId
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={sid} className="block cursor-pointer text-body font-semibold text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-small text-ink-2">{description}</p>}
      </div>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line')}
      >
        <span className={cx('absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: LucideIcon }[]
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex rounded-full bg-surface-2 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors',
              size === 'sm' ? 'h-8 px-3 text-small' : 'h-9 px-4 text-small',
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({
  selected,
  onClick,
  children,
  icon: Icon,
  count,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  icon?: LucideIcon
  count?: number
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-small font-semibold transition-colors',
        selected ? 'bg-primary text-primary-fg' : 'bg-surface text-ink-2 ring-1 ring-inset ring-line hover:text-ink',
      )}
    >
      {Icon && <Icon size={15} aria-hidden />}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cx(
            'ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-caption',
            selected ? 'bg-accent text-accent-fg' : 'bg-primary text-primary-fg',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
