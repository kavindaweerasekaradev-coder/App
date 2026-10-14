import type { Currency } from '../types'

export const CURRENCIES: { code: Currency; label: string; flag: string; rate: number }[] = [
  { code: 'USD', label: 'US Dollar', flag: '🇺🇸', rate: 1 },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺', rate: 0.92 },
  { code: 'LKR', label: 'Sri Lankan Rupee', flag: '🇱🇰', rate: 300.4 },
]

const rateOf = (c: Currency) => CURRENCIES.find((x) => x.code === c)!.rate

const formatters = new Map<string, Intl.NumberFormat>()
function formatter(currency: Currency, compact: boolean, decimals: boolean) {
  const key = `${currency}|${compact}|${decimals}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: currency === 'LKR' ? 'code' : 'narrowSymbol',
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: compact || !decimals ? 0 : 2,
      maximumFractionDigits: compact ? 1 : decimals ? 2 : 0,
    })
    formatters.set(key, f)
  }
  return f
}

export interface MoneyOptions {
  compact?: boolean
  /** Show a leading + for positive values. */
  signed?: boolean
  decimals?: boolean
}

/** Format a USD base amount in the display currency. */
export function formatMoney(usd: number, currency: Currency, opts: MoneyOptions = {}): string {
  const value = usd * rateOf(currency)
  const text = formatter(currency, !!opts.compact, opts.decimals ?? true).format(Math.abs(value))
  if (value < 0) return `−${text}`
  if (opts.signed && value > 0) return `+${text}`
  return text
}

/** Split a formatted amount into whole and cents so the hero can style them separately. */
export function splitMoney(usd: number, currency: Currency): { whole: string; cents: string } {
  const full = formatMoney(usd, currency)
  const dot = full.lastIndexOf('.')
  return dot === -1 ? { whole: full, cents: '' } : { whole: full.slice(0, dot), cents: full.slice(dot) }
}

export function toUSD(amount: number, currency: Currency): number {
  return amount / rateOf(currency)
}

export function formatPercent(ratio: number, opts: { signed?: boolean; decimals?: number } = {}): string {
  const pct = ratio * 100
  const text = `${Math.abs(pct).toFixed(opts.decimals ?? 0)}%`
  if (pct < 0) return `−${text}`
  if (opts.signed && pct > 0) return `+${text}`
  return text
}
