import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90 shadow-sm',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2',
  ghost: 'text-primary-ink hover:bg-primary-soft',
  accent: 'bg-accent text-accent-fg hover:brightness-95 shadow-sm',
  danger: 'bg-danger-soft text-danger hover:bg-danger/15',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-small rounded-full',
  md: 'h-11 px-5 text-body rounded-full',
  lg: 'h-[3.25rem] px-6 text-body rounded-full',
}

export interface ButtonStyleProps {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
}

export function buttonClass({ variant = 'primary', size = 'md', block }: ButtonStyleProps, extra?: string) {
  return cx(base, variants[variant], sizes[size], block && 'w-full', extra)
}

function Inner({ icon: Icon, iconRight: IconRight, size = 'md', children }: ButtonStyleProps & { children?: ReactNode }) {
  const s = size === 'sm' ? 16 : 18
  return (
    <>
      {Icon && <Icon size={s} strokeWidth={2} aria-hidden />}
      {children}
      {IconRight && <IconRight size={s} strokeWidth={2} aria-hidden />}
    </>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps>(function Button(
  { variant, size, icon, iconRight, block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass({ variant, size, block }, className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Inner>
    </button>
  )
})

export function ButtonLink({ variant, size, icon, iconRight, block, className, children, ...rest }: LinkProps & ButtonStyleProps) {
  return (
    <Link className={buttonClass({ variant, size, block }, className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Inner>
    </Link>
  )
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; tone?: 'surface' | 'ghost' | 'primary'; badge?: boolean }
>(function IconButton({ icon: Icon, label, tone = 'surface', badge, className, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95',
        tone === 'surface' && 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2',
        tone === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        tone === 'primary' && 'bg-primary text-primary-fg hover:bg-primary/90',
        className,
      )}
      {...rest}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden />
      {badge && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
    </button>
  )
})
