import { useState, type FormEvent, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { VEHICLE_COLORS, VEHICLE_MODELS } from '@/data/vehicles'
import type { Vehicle } from '@/data/types'
import { estimatedRangeKm } from '@/lib/charging'
import { cx } from '@/lib/format'
import { TextField } from '@/components/ui/forms'

type Errors = Partial<Record<keyof Vehicle, string>>

const PLATE = /^([A-Z]{2}\s)?[A-Z]{2,3}[-\s]?\d{4}$/i

export function validateVehicle(v: Vehicle): Errors {
  const e: Errors = {}
  if (v.ownerName && !/^[\p{L}][\p{L}' -]{0,29}$/u.test(v.ownerName.trim())) e.ownerName = 'Use letters only (up to 30).'
  const nick = v.nickname.trim()
  if (!nick) e.nickname = 'Give your vehicle a name.'
  else if (nick.length < 2 || nick.length > 24) e.nickname = 'Use 2–24 characters.'
  if (!VEHICLE_MODELS.some((m) => m.id === v.modelId)) e.modelId = 'Choose your vehicle model.'
  if (v.plate && !PLATE.test(v.plate.trim())) e.plate = 'Use a format like CAB-4821 or WP CAB-4821.'
  if (!Number.isFinite(v.batteryPct) || v.batteryPct < 1 || v.batteryPct > 100) e.batteryPct = 'Enter a value between 1 and 100.'
  return e
}

export function VehicleForm({
  initial,
  onSubmit,
  onDraftChange,
  footer,
  id = 'vehicle-form',
}: {
  initial: Vehicle
  onSubmit: (v: Vehicle) => void
  onDraftChange?: (v: Vehicle) => void
  footer?: ReactNode
  id?: string
}) {
  const [v, setV] = useState<Vehicle>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<keyof Vehicle, boolean>>>({})
  const errors = validateVehicle(v)
  const show = (k: keyof Vehicle) => (submitted || touched[k] ? errors[k] : undefined)
  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) => {
    const next = { ...v, [k]: val }
    setV(next)
    onDraftChange?.(next)
  }
  const blur = (k: keyof Vehicle) => () => setTouched((t) => ({ ...t, [k]: true }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) {
      const first = document.querySelector<HTMLElement>(`#${id} [aria-invalid="true"]`)
      first?.focus()
      return
    }
    onSubmit({ ...v, nickname: v.nickname.trim(), ownerName: v.ownerName.trim(), plate: v.plate.trim().toUpperCase() })
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your first name"
          hint="Optional — used for greetings."
          value={v.ownerName}
          onChange={(e) => set('ownerName', e.target.value)}
          onBlur={blur('ownerName')}
          error={show('ownerName')}
          autoComplete="given-name"
        />
        <TextField
          label="Vehicle name"
          placeholder="e.g. Daily Driver"
          value={v.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          onBlur={blur('nickname')}
          error={show('nickname')}
          required
          maxLength={30}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-small font-semibold text-ink">Model</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {VEHICLE_MODELS.map((m) => {
            const active = v.modelId === m.id
            return (
              <label
                key={m.id}
                className={cx(
                  'relative flex cursor-pointer flex-col rounded p-3.5 ring-1 ring-inset transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-ink',
                  active ? 'bg-primary-soft ring-primary' : 'bg-surface ring-line hover:bg-surface-2',
                )}
              >
                <input type="radio" name="model" value={m.id} checked={active} onChange={() => set('modelId', m.id)} className="sr-only" />
                <span className="text-body font-bold text-ink">
                  {m.maker} {m.name}
                </span>
                <span className="tabular mt-0.5 text-small text-ink-2">
                  {m.batteryKwh} kWh · ~{Math.round(estimatedRangeKm(m, 100))} km est. · {m.connectors.join(' / ')}
                </span>
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-fg">
                    <Check size={13} strokeWidth={3} aria-hidden />
                  </span>
                )}
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-small text-ink-3">Sample catalogue of fictional models. Specs are illustrative.</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-small font-semibold text-ink">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_COLORS.map((c) => {
            const active = v.color === c.id
            return (
              <label
                key={c.id}
                className={cx(
                  'flex h-10 cursor-pointer items-center gap-2 rounded-full pl-1.5 pr-3.5 text-small font-semibold ring-1 ring-inset has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-ink',
                  active ? 'bg-primary-soft text-ink ring-primary' : 'bg-surface text-ink-2 ring-line',
                )}
              >
                <input type="radio" name="color" value={c.id} checked={active} onChange={() => set('color', c.id)} className="sr-only" />
                <span className="h-7 w-7 rounded-full ring-1 ring-inset ring-black/10" style={{ background: c.body }} aria-hidden />
                {c.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Registration"
          placeholder="CAB-4821"
          hint="Optional."
          value={v.plate}
          onChange={(e) => set('plate', e.target.value)}
          onBlur={blur('plate')}
          error={show('plate')}
          autoCapitalize="characters"
        />
        <TextField
          label="Current battery level"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          suffix="%"
          hint="As shown in your vehicle."
          value={Number.isFinite(v.batteryPct) ? v.batteryPct : ''}
          onChange={(e) => set('batteryPct', e.target.value === '' ? NaN : Number(e.target.value))}
          onBlur={blur('batteryPct')}
          error={show('batteryPct')}
        />
      </div>
      {footer}
    </form>
  )
}
