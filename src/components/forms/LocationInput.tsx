import { useId, useMemo, useRef, useState } from 'react'
import { CircleAlert, LocateFixed, MapPin, Zap, type LucideIcon } from 'lucide-react'
import { PLACES } from '@/data/places'
import { STATIONS } from '@/data/stations'
import type { Waypoint } from '@/lib/journey'
import { cx } from '@/lib/format'

export interface LocationOption extends Waypoint {
  kind: 'current' | 'place' | 'station'
}

export function allLocationOptions(current: LocationOption): LocationOption[] {
  return [
    current,
    ...PLACES.map<LocationOption>((p) => ({ id: p.id, name: p.name, subtitle: p.subtitle, lat: p.lat, lng: p.lng, kind: 'place' })),
    ...STATIONS.map<LocationOption>((s) => ({
      id: s.id,
      name: s.name,
      subtitle: `Charging station · ${s.area}`,
      lat: s.lat,
      lng: s.lng,
      kind: 'station',
      stationId: s.id,
    })),
  ]
}

const ICON: Record<LocationOption['kind'], LucideIcon> = { current: LocateFixed, place: MapPin, station: Zap }

/** Accessible combobox (ARIA 1.2 pattern) for choosing a known location. */
export function LocationInput({
  label,
  value,
  text,
  onText,
  onSelect,
  options,
  error,
  placeholder,
  dotClass,
}: {
  label: string
  value: LocationOption | null
  text: string
  onText: (t: string) => void
  onSelect: (o: LocationOption) => void
  options: LocationOption[]
  error?: string
  placeholder?: string
  dotClass: string
}) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (value && text === value.name) return options.filter((o) => o.kind !== 'station').slice(0, 7)
    if (!q) return options.filter((o) => o.kind !== 'station').slice(0, 7)
    return options
      .filter((o) => o.name.toLowerCase().includes(q) || o.subtitle.toLowerCase().includes(q))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
      .slice(0, 8)
  }, [text, options, value])

  const choose = (o: LocationOption) => {
    onSelect(o)
    setOpen(false)
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <span className={cx('absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full', dotClass)} aria-hidden />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          autoComplete="off"
          placeholder={placeholder ?? label}
          value={text}
          onChange={(e) => {
            onText(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(a + 1, matches.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && open && matches[active]) {
              e.preventDefault()
              choose(matches[active])
            } else if (e.key === 'Escape') setOpen(false)
          }}
          className={cx(
            'h-12 w-full rounded bg-surface-2 pl-10 pr-4 text-body font-semibold text-ink placeholder:font-normal placeholder:text-ink-3 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-ink',
            error && 'ring-2 ring-danger',
          )}
        />
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-small text-danger">
          <CircleAlert size={14} aria-hidden />
          {error}
        </p>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded bg-surface p-1.5 shadow-float ring-1 ring-line"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-3 text-small text-ink-2">No matching places. Try a town such as Kandy or Galle.</li>
          ) : (
            matches.map((o, i) => {
              const Icon = ICON[o.kind]
              return (
                <li
                  key={o.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cx('flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5', i === active && 'bg-surface-2')}
                >
                  <Icon size={18} className={o.kind === 'station' ? 'text-primary-ink' : 'text-ink-3'} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold">{o.name}</span>
                    <span className="block truncate text-small text-ink-2">{o.subtitle}</span>
                  </span>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
