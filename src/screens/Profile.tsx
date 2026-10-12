import { useState, type ReactNode } from 'react'
import { BookmarkX, Check, Info, MapPin, Monitor, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { useApp, useVehicle, type ThemePref } from '@/state/AppState'
import { PLACES } from '@/data/places'
import { getStation } from '@/data/stations'
import { VEHICLE_COLORS } from '@/data/vehicles'
import { estimatedRangeKm } from '@/lib/charging'
import { haversineKm } from '@/lib/geo'
import { formatKm, formatLkr } from '@/lib/format'
import { useUserLocation } from '@/lib/hooks'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { VehicleForm } from '@/components/forms/VehicleForm'
import { PrefsForm } from '@/components/forms/PrefsForm'
import { StationCard } from '@/components/station/StationBits'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Segmented, SelectField, Switch } from '@/components/ui/forms'
import { Card, SectionHeader } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/StateView'
import { CarIllustration } from '@/components/vehicle/CarIllustration'

export function Profile() {
  const app = useApp()
  const { vehicle, model } = useVehicle()
  const here = useUserLocation()
  const [editVehicle, setEditVehicle] = useState(false)
  const [editPrefs, setEditPrefs] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  const saved = app.savedStationIds.map(getStation).filter((s): s is NonNullable<typeof s> => !!s)
  const colorLabel = VEHICLE_COLORS.find((c) => c.id === vehicle.color)?.label
  const { prefs } = app

  return (
    <Page wide>
      <PageHeader title="Profile & settings" />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Vehicle */}
          <section aria-labelledby="vehicle">
            <SectionHeader id="vehicle" title="Vehicle" action="Edit" onAction={() => setEditVehicle(true)} />
            <Card className="overflow-hidden">
              <div className="flex items-center gap-4 bg-surface-2/60 p-4">
                <div className="w-32 shrink-0 sm:w-40">
                  <CarIllustration color={vehicle.color} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-title font-bold">{vehicle.nickname}</p>
                  <p className="truncate text-small text-ink-2">
                    {model.maker} {model.name} · {colorLabel}
                  </p>
                  {vehicle.ownerName && <p className="truncate text-small text-ink-3">Driver: {vehicle.ownerName}</p>}
                </div>
              </div>
              <dl className="divide-y divide-line">
                <Row label="Battery capacity" value={`${model.batteryKwh} kWh`} />
                <Row label="Range at 100% (est.)" value={`~${formatKm(estimatedRangeKm(model, 100))}`} />
                <Row label="Average consumption" value={`${model.efficiency} kWh/100 km`} />
                <Row label="Connectors" value={model.connectors.join(', ')} />
                <Row label="Max charging" value={`${model.maxDcKw} kW DC · ${model.maxAcKw} kW AC`} />
                <Row label="Registration" value={vehicle.plate || 'Not set'} />
              </dl>
            </Card>
          </section>

          {/* Charging preferences */}
          <section aria-labelledby="prefs">
            <SectionHeader id="prefs" title="Charging preferences" action="Edit" onAction={() => setEditPrefs(true)} />
            <Card>
              <dl className="divide-y divide-line">
                <Row label="Charge target" value={`${prefs.targetPct}%`} />
                <Row label="Arrival reserve" value={`${prefs.reservePct}%`} />
                <Row label="Prefer fast chargers" value={prefs.preferFastCharging ? 'Yes' : 'No'} />
                <Row label="Home charging" value={prefs.homeCharging ? `${formatLkr(prefs.homeTariff)}/kWh from ${prefs.homeStartTime}` : 'Off'} />
              </dl>
            </Card>
          </section>

          {/* Location */}
          <section aria-labelledby="loc">
            <SectionHeader id="loc" title="Location" />
            <Card className="p-4">
              <SelectField
                label="Location used for nearby chargers"
                value={app.locationId}
                onChange={(e) => {
                  app.update({ locationId: e.target.value, locationMode: 'manual' })
                  flash('Location updated')
                }}
                hint="This prototype uses a sample location instead of your device’s GPS."
              >
                {PLACES.filter((p) => p.major || p.id === 'colombo-03').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            </Card>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {/* Saved stations */}
          <section aria-labelledby="saved">
            <SectionHeader id="saved" title={`Saved stations${saved.length ? ` (${saved.length})` : ''}`} />
            {saved.length === 0 ? (
              <Card>
                <EmptyState
                  icon={BookmarkX}
                  title="No saved stations"
                  body="Tap the bookmark on any station to keep it here for quick access."
                  action={
                    <ButtonLink to="/explore" icon={MapPin}>
                      Explore stations
                    </ButtonLink>
                  }
                />
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {saved.map((s) => (
                  <li key={s.id}>
                    <StationCard station={s} model={model} distanceKm={haversineKm(here, s)} saved onToggleSave={() => app.toggleSaved(s.id)} compact />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notifications */}
          <section aria-labelledby="notif">
            <SectionHeader id="notif" title="Notifications" />
            <Card className="divide-y divide-line px-4">
              <NotifSwitch k="chargeComplete" label="Charging complete" description="When a session reaches your target." />
              <NotifSwitch k="chargeReminder" label="Plug-in reminder" description="Evening reminder if you’re below your target." />
              <NotifSwitch k="lowBattery" label="Low battery" description={`When you’re within 10% of your ${prefs.reservePct}% reserve.`} />
              <NotifSwitch k="tripTips" label="Trip suggestions" description="Charging tips before long journeys." />
              <NotifSwitch k="weeklySummary" label="Weekly energy summary" description="A short recap every Monday." />
            </Card>
            <p className="mt-2 text-caption text-ink-3">In this prototype, notifications appear in the Home bell only.</p>
          </section>

          {/* Appearance */}
          <section aria-labelledby="appearance">
            <SectionHeader id="appearance" title="Appearance" />
            <Card className="p-4">
              <Segmented<ThemePref>
                label="Theme"
                value={app.theme}
                onChange={(t) => app.update({ theme: t })}
                className="w-full"
                options={[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ]}
              />
            </Card>
          </section>

          {/* Demo */}
          <section aria-labelledby="demo">
            <SectionHeader id="demo" title="Prototype & data" />
            <Card className="px-4">
              <Switch
                label="Simulate network errors"
                description="Make data requests fail so you can review error and retry states."
                checked={app.simulateErrors}
                onChange={(v) => app.update({ simulateErrors: v })}
              />
              <div className="flex flex-wrap gap-2 border-t border-line py-4">
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => app.update({ onboarded: false })}>
                  Replay onboarding
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmReset(true)}>
                  Reset all data
                </Button>
              </div>
            </Card>
            <p className="mt-3 flex gap-2 text-small text-ink-2">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              Velora 0.1 is a design prototype. Stations, networks, vehicles, prices and availability are fictional sample data. It doesn’t connect to real
              vehicles or charging networks, and all ranges, times and costs are estimates.
            </p>
          </section>
        </div>
      </div>

      <Sheet
        open={editVehicle}
        onClose={() => setEditVehicle(false)}
        title="Edit vehicle"
        footer={
          <Button type="submit" form="profile-vehicle" size="lg" block icon={Check}>
            Save vehicle
          </Button>
        }
      >
        <VehicleForm
          id="profile-vehicle"
          initial={vehicle}
          onSubmit={(v) => {
            app.setVehicle(v)
            setEditVehicle(false)
            flash('Vehicle saved')
          }}
        />
      </Sheet>

      <Sheet
        open={editPrefs}
        onClose={() => setEditPrefs(false)}
        title="Charging preferences"
        footer={
          <Button type="submit" form="profile-prefs" size="lg" block icon={Check}>
            Save preferences
          </Button>
        }
      >
        <PrefsForm
          id="profile-prefs"
          initial={prefs}
          onSubmit={(p) => {
            app.setPrefs(p)
            setEditPrefs(false)
            flash('Preferences saved')
          }}
        />
      </Sheet>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" block onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button size="lg" block onClick={app.resetAll}>
              Reset
            </Button>
          </div>
        }
      >
        <p className="text-body text-ink-2">
          This clears your vehicle, preferences, saved stations and simulated sessions on this device, then restarts setup.
        </p>
      </Sheet>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 md:bottom-8">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-small font-semibold text-bg shadow-float">
            <Check size={16} aria-hidden /> {toast}
          </span>
        </div>
      )}
    </Page>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-small text-ink-2">{label}</dt>
      <dd className="tabular text-right text-small font-semibold text-ink">{value}</dd>
    </div>
  )
}

function NotifSwitch({ k, label, description }: { k: keyof ReturnType<typeof useApp>['notifications']; label: string; description: string }) {
  const app = useApp()
  return (
    <Switch
      label={label}
      description={description}
      checked={app.notifications[k]}
      onChange={(v) => app.update((p) => ({ notifications: { ...p.notifications, [k]: v } }))}
    />
  )
}
