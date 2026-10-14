const pad = (n: number) => String(n).padStart(2, '0')

/** Local-time yyyy-mm-dd (avoids the UTC shift of toISOString). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** yyyy-mm key for grouping by month. */
export function monthKey(d: Date | string): string {
  return typeof d === 'string' ? d.slice(0, 7) : `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export function monthLabel(key: string, style: 'long' | 'short' = 'long'): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: style })
}

export function lastMonths(count: number, from = new Date()): string[] {
  const current = monthKey(from)
  return Array.from({ length: count }, (_, i) => shiftMonth(current, i - count + 1))
}

export function relativeDay(iso: string, today = new Date()): string {
  const date = parseISODate(iso)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((start.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

export function longDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function monthsUntil(iso: string, today = new Date()): number {
  const d = parseISODate(iso)
  return Math.max(0, (d.getFullYear() - today.getFullYear()) * 12 + d.getMonth() - today.getMonth())
}
