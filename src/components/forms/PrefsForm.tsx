import { useState, type FormEvent, type ReactNode } from 'react'
import type { ChargingPrefs } from '@/data/types'
import { Slider, Switch, TextField } from '@/components/ui/forms'

type Errors = Partial<Record<keyof ChargingPrefs, string>>

export function validatePrefs(p: ChargingPrefs): Errors {
  const e: Errors = {}
  if (p.reservePct > p.targetPct - 20) e.reservePct = 'Keep your reserve at least 20% below your charge target.'
  if (p.homeCharging) {
    if (!Number.isFinite(p.homeTariff) || p.homeTariff <= 0) e.homeTariff = 'Enter your electricity rate.'
    else if (p.homeTariff > 300) e.homeTariff = 'That looks too high — enter a rate under LKR 300.'
    if (!/^\d{2}:\d{2}$/.test(p.homeStartTime)) e.homeStartTime = 'Choose a start time.'
  }
  return e
}

export function PrefsForm({
  initial,
  onSubmit,
  footer,
  id = 'prefs-form',
}: {
  initial: ChargingPrefs
  onSubmit: (p: ChargingPrefs) => void
  footer?: ReactNode
  id?: string
}) {
  const [p, setP] = useState<ChargingPrefs>(initial)
  const [submitted, setSubmitted] = useState(false)
  const errors = validatePrefs(p)
  const set = <K extends keyof ChargingPrefs>(k: K, val: ChargingPrefs[K]) => setP((prev) => ({ ...prev, [k]: val }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) return
    onSubmit(p)
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Slider
        label="Charge target"
        value={p.targetPct}
        min={50}
        max={100}
        step={5}
        onChange={(v) => set('targetPct', v)}
        hint="Many manufacturers suggest around 80% for daily use — check your vehicle’s guidance. Lower targets also keep fast-charging stops shorter."
      />
      <div>
        <Slider
          label="Arrival reserve"
          value={p.reservePct}
          min={5}
          max={30}
          step={5}
          onChange={(v) => set('reservePct', v)}
          hint="Journey plans keep at least this much charge when you arrive."
        />
        {errors.reservePct && (
          <p className="mt-1.5 text-small text-danger" role="alert">
            {errors.reservePct}
          </p>
        )}
      </div>

      <div className="divide-y divide-line rounded bg-surface px-4 ring-1 ring-inset ring-line">
        <Switch
          label="Prefer fast chargers"
          description="Give DC chargers of 50 kW and above priority in nearby results."
          checked={p.preferFastCharging}
          onChange={(v) => set('preferFastCharging', v)}
        />
        <Switch
          label="I charge at home"
          description="Include home charging in costs and reminders."
          checked={p.homeCharging}
          onChange={(v) => set('homeCharging', v)}
        />
      </div>

      {p.homeCharging && (
        <div className="grid animate-fade-up gap-5 sm:grid-cols-2">
          <TextField
            label="Home electricity rate"
            type="number"
            inputMode="decimal"
            suffix="LKR/kWh"
            value={Number.isFinite(p.homeTariff) ? p.homeTariff : ''}
            onChange={(e) => set('homeTariff', e.target.value === '' ? NaN : Number(e.target.value))}
            error={submitted ? errors.homeTariff : undefined}
            hint="From your electricity bill. Used for cost estimates only."
          />
          <TextField
            label="Usual start time"
            type="time"
            value={p.homeStartTime}
            onChange={(e) => set('homeStartTime', e.target.value)}
            error={submitted ? errors.homeStartTime : undefined}
            hint="For example, an off-peak window."
          />
        </div>
      )}
      {footer}
    </form>
  )
}
