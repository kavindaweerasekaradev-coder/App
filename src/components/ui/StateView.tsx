import type { ReactNode } from 'react'
import { RefreshCw, WifiOff, type LucideIcon } from 'lucide-react'
import { Button } from './Button'
import { cx } from '@/lib/format'

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
        <Icon size={24} strokeWidth={1.8} aria-hidden />
      </div>
      <h3 className="text-title font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-body text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  className,
  title = 'Something went wrong',
}: {
  message: string
  onRetry?: () => void
  className?: string
  title?: string
}) {
  return (
    <div role="alert" className={cx('flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WifiOff size={24} strokeWidth={1.8} aria-hidden />
      </div>
      <h3 className="text-title font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-body text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
