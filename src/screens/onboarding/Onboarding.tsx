import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BatteryCharging, Info, LocateFixed, MapPin, Route } from 'lucide-react'
import { useApp } from '@/state/AppState'
import { DEFAULT_LOCATION_ID, getPlace, PLACES } from '@/data/places'
import { STATIONS } from '@/data/stations'
import type { ChargingPrefs, Vehicle } from '@/data/types'
import { Button, IconButton } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/forms'
import { Notice, ProgressBar } from '@/components/ui/primitives'
import { CarIllustration } from '@/components/vehicle/CarIllustration'
import { VehicleForm } from '@/components/forms/VehicleForm'
import { PrefsForm } from '@/components/forms/PrefsForm'
import { SimulatedMap } from '@/components/map/SimulatedMap'
import { Logo } from '@/components/layout/AppShell'

const STEPS = ['Your vehicle', 'Charging preferences', 'Location'] as const

export function Onboarding() {
  const app = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [vehicle, setVehicle] = useState<Vehicle>(app.vehicle)
  const [prefs, setPrefs] = useState<ChargingPrefs>(app.prefs)
  const [previewColor, setPreviewColor] = useState(app.vehicle.color)
  const [manual, setManual] = useState(false)
  const [city, setCity] = useState('')
  const [cityError, setCityError] = useState<string>()

  const finish = (locationId: string, mode: 'simulated' | 'manual') => {
    app.update({ vehicle, prefs, locationId, locationMode: mode, onboarded: true })
    navigate('/', { replace: true })
  }

  if (step === 0) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#14382B] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="lg:order-2">
            <div className="flex items-center justify-between lg:hidden">
              <Logo className="text-white [&_rect]:fill-white/10" />
            </div>
            <div className="relative mx-auto mt-10 max-w-md lg:mt-0">
              <div className="absolute inset-x-6 bottom-3 h-16 rounded-full bg-[#C8F24A]/20 blur-2xl" aria-hidden />
              <CarIllustration color="pearl" charging className="relative drop-shadow-2xl" />
            </div>
          </div>
          <div className="mt-auto flex flex-col lg:order-1 lg:mt-0">
            <Logo className="mb-10 hidden text-white lg:inline-flex [&_rect]:fill-white/10" />
            <p className="label !text-[#C8F24A]">EV companion</p>
            <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.5rem]">Every journey, intelligently powered.</h1>
            <ul className="mt-6 flex flex-col gap-3 text-body text-white/80">
              {[
                { icon: BatteryCharging, text: 'Battery, range and charging status at a glance' },
                { icon: MapPin, text: 'Find chargers that fit your vehicle’s connectors' },
                { icon: Route, text: 'Plan trips with charging stops and arrival estimates' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#C8F24A]">
                    <Icon size={18} aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <Button variant="accent" size="lg" block iconRight={ArrowRight} className="mt-8 lg:w-auto lg:self-start lg:px-8" onClick={() => setStep(1)}>
              Get started
            </Button>
            <p className="mt-4 flex gap-2 text-small text-white/60">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              This is a prototype with sample data. It doesn’t connect to real vehicles or charging networks.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const title = STEPS[step - 1]
  const descriptions = [
    'Tell us about your EV so range, compatibility and cost estimates fit your car.',
    'These shape charging estimates and journey plans. You can change them any time.',
    'Velora uses your location to show nearby chargers and plan journeys from where you are.',
  ]
  const formId = ['vehicle-form', 'prefs-form'][step - 1]

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">
        <header className="flex items-center gap-3 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <IconButton icon={ArrowLeft} label="Back" onClick={() => setStep(step - 1)} />
          <div className="flex-1">
            <p className="tabular text-small font-semibold text-ink-2">
              Step {step} of {STEPS.length}
            </p>
            <ProgressBar value={step} max={STEPS.length} label="Setup progress" className="mt-1.5" height="h-1.5" />
          </div>
        </header>

        <div key={step} className="animate-fade-up pb-32 pt-4">
          <h1 className="text-headline font-bold">{title}</h1>
          <p className="mt-1 text-body text-ink-2">{descriptions[step - 1]}</p>

          <div className="mt-6">
            {step === 1 && (
              <>
                <div className="card mb-6 flex items-center justify-center bg-surface-2 px-6 py-4 shadow-none">
                  <CarIllustration color={previewColor} className="max-w-xs" />
                </div>
                <VehicleForm
                  initial={vehicle}
                  onSubmit={(v) => {
                    setVehicle(v)
                    setStep(2)
                  }}
                  onDraftChange={(d) => d.color !== previewColor && setPreviewColor(d.color)}
                />
              </>
            )}
            {step === 2 && (
              <PrefsForm
                initial={prefs}
                onSubmit={(p) => {
                  setPrefs(p)
                  setStep(3)
                }}
              />
            )}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <SimulatedMap
                  interactive={false}
                  stations={STATIONS}
                  user={getPlace(DEFAULT_LOCATION_ID)}
                  initial={{ ...getPlace(DEFAULT_LOCATION_ID)!, scale: 38 }}
                  className="h-48 rounded-lg"
                />
                <Notice icon={Info}>This prototype doesn’t read your device’s location. It uses a sample location in Colombo, or a city you choose.</Notice>
                {manual && (
                  <SelectField
                    label="Your city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setCityError(undefined)
                    }}
                    error={cityError}
                  >
                    <option value="">Select a city</option>
                    {PLACES.filter((p) => p.major || p.id === 'colombo-03').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {step < 3 ? (
            <Button type="submit" form={formId} size="lg" block iconRight={ArrowRight}>
              Continue
            </Button>
          ) : manual ? (
            <>
              <Button variant="secondary" size="lg" onClick={() => setManual(false)}>
                Cancel
              </Button>
              <Button
                size="lg"
                block
                onClick={() => {
                  if (!city) return setCityError('Choose a city to continue.')
                  finish(city, 'manual')
                }}
              >
                Finish setup
              </Button>
            </>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
              <Button size="lg" block icon={LocateFixed} onClick={() => finish(DEFAULT_LOCATION_ID, 'simulated')}>
                Use sample location
              </Button>
              <Button variant="secondary" size="lg" block onClick={() => setManual(true)}>
                Choose a city instead
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
