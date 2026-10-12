import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ChevronRight, Zap } from 'lucide-react'
import type { Station, VehicleModel } from '@/data/types'
import { availabilityOf, isCompatible, stationAvailable, stationMaxKw, stationMinPrice, stationTotal } from '@/lib/charging'
import { cx, formatKm, formatLkr } from '@/lib/format'
import { Badge } from '@/components/ui/primitives'

export function AvailabilityBadge({ station }: { station: Station }) {
  const a = availabilityOf(station)
  if (a === 'offline')
    return (
      <Badge tone="neutral" dot>
        Offline
      </Badge>
    )
  if (a === 'busy')
    return (
      <Badge tone="warning" dot>
        All in use
      </Badge>
    )
  return (
    <Badge tone="success" dot>
      {stationAvailable(station)} of {stationTotal(station)} free
    </Badge>
  )
}

export function ConnectorTags({ station, model }: { station: Station; model: VehicleModel }) {
  const types = [...new Set(station.connectors.map((c) => c.type))]
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => {
        const ok = model.connectors.includes(t)
        return (
          <span
            key={t}
            className={cx(
              'inline-flex h-6 items-center rounded-full px-2 text-caption font-semibold ring-1 ring-inset',
              ok ? 'text-ink ring-line' : 'text-ink-3 line-through decoration-ink-3/60 ring-line/60',
            )}
            title={ok ? `${t} — compatible with your vehicle` : `${t} — not compatible with your vehicle`}
          >
            {t}
          </span>
        )
      })}
    </div>
  )
}

export function StationCard({
  station,
  model,
  distanceKm,
  saved,
  onToggleSave,
  compact,
  selected,
  onHover,
}: {
  station: Station
  model: VehicleModel
  distanceKm?: number
  saved?: boolean
  onToggleSave?: () => void
  compact?: boolean
  selected?: boolean
  onHover?: () => void
}) {
  const compatible = isCompatible(station, model)
  return (
    <article onMouseEnter={onHover} className={cx('card relative flex gap-3 p-4 transition-shadow hover:shadow-float', selected && 'ring-2 ring-primary')}>
      <div
        className={cx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          availabilityOf(station) === 'available' ? 'bg-primary text-accent' : 'bg-surface-2 text-ink-3',
        )}
        aria-hidden
      >
        <Zap size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="pr-10 text-body font-bold leading-snug text-ink">
          <Link to={`/stations/${station.id}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
            {station.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-small text-ink-2">
          {distanceKm !== undefined && <span className="tabular">{formatKm(distanceKm)} · </span>}
          {station.area}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <AvailabilityBadge station={station} />
          <span className="tabular text-small font-semibold text-ink">Up to {stationMaxKw(station)} kW</span>
          {!compact && <span className="tabular text-small text-ink-2">from {formatLkr(stationMinPrice(station))}/kWh</span>}
        </div>
        {!compact && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <ConnectorTags station={station} model={model} />
            {!compatible && <span className="text-caption font-semibold text-danger">Not compatible</span>}
          </div>
        )}
      </div>
      {onToggleSave ? (
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${station.name} from saved` : `Save ${station.name}`}
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-primary-ink"
        >
          {saved ? <BookmarkCheck size={20} className="text-primary-ink" aria-hidden /> : <Bookmark size={20} aria-hidden />}
        </button>
      ) : (
        <ChevronRight size={18} className="mt-3 shrink-0 text-ink-3" aria-hidden />
      )}
    </article>
  )
}
