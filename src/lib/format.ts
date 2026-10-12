const lkr = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 })

export function formatLkr(value: number): string {
  return `LKR ${lkr.format(Math.round(value))}`
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatKwh(kwh: number, digits = 1): string {
  return `${kwh.toFixed(digits)} kWh`
}

export function formatKw(kw: number): string {
  return `${kw % 1 === 0 ? kw : kw.toFixed(1)} kW`
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatRelativeDay(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Yesterday, ${time}`
  if (diff < 7) return `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${time}`
  return formatShortDate(iso)
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
