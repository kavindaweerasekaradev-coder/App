import { useMemo, useState } from 'react'
import { STORES, STORE_BY_ID, nearestStore } from '../data/stores'
import type { Fulfilment } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

export function FulfilmentToggle({ value, onChange }: { value: Fulfilment; onChange: (f: Fulfilment) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Order type">
      {(['delivery', 'pickup'] as const).map((f) => (
        <button key={f} type="button" role="radio" aria-checked={value === f} className="segmented__opt" onClick={() => onChange(f)}>
          <Icon name={f === 'delivery' ? 'scooter' : 'store'} size={18} />
          {f === 'delivery' ? 'Delivery' : 'Pickup'}
        </button>
      ))}
    </div>
  )
}

export function LocationDialog() {
  const { locationOpen } = useUi()
  // Mounting on open gives the form fresh state from the saved location each time.
  return locationOpen ? <LocationForm /> : null
}

function LocationForm() {
  const { state, dispatch } = useStore()
  const { setLocationOpen, showToast } = useUi()
  const [mode, setMode] = useState<Fulfilment>(state.fulfilment)
  const [query, setQuery] = useState('')
  const [storeId, setStoreId] = useState(state.location?.storeId ?? '')
  const [address, setAddress] = useState(state.location?.address ?? '')
  const [landmark, setLandmark] = useState(state.location?.landmark ?? '')
  const [geo, setGeo] = useState<'idle' | 'busy' | 'denied'>('idle')
  const [error, setError] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STORES.filter((s) => !q || `${s.area} ${s.city} ${s.address}`.toLowerCase().includes(q))
  }, [query])

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return setGeo('denied')
    setGeo('busy')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreId(nearestStore(pos.coords.latitude, pos.coords.longitude).id)
        setGeo('idle')
      },
      () => setGeo('denied'),
      { timeout: 8000 },
    )
  }

  const save = () => {
    if (!storeId) return setError(mode === 'delivery' ? 'Choose your area so we can find your nearest store.' : 'Choose a store to pick up from.')
    if (mode === 'delivery' && address.trim().length < 5) return setError('Add your house number and street so the rider can find you.')
    const changedMode = mode !== state.fulfilment
    dispatch({
      type: 'setLocation',
      fulfilment: mode,
      // Keep the address when switching to pickup so switching back doesn't lose it.
      location: { storeId, address: address.trim(), landmark: landmark.trim() },
    })
    setLocationOpen(false)
    if (changedMode && state.cart.length) {
      showToast({ text: mode === 'pickup' ? 'Switched to pickup. Your cart is kept and there’s no delivery fee.' : 'Switched to delivery. Your cart is kept.' })
    }
  }

  const selected = storeId ? STORE_BY_ID[storeId] : null

  return (
    <Dialog
      open
      onClose={() => setLocationOpen(false)}
      title="Where should we bring your pizza?"
      className="loc-dialog"
      footer={
        <>
          {error && (
            <p className="form-error" role="alert">
              <Icon name="info" size={16} /> {error}
            </p>
          )}
          <button type="button" className="btn btn--primary btn--block" onClick={save}>
            {mode === 'delivery' ? 'Deliver here' : 'Pick up from this store'}
          </button>
        </>
      }
    >
      <p className="muted">You can browse the menu and build your cart first. Switching later keeps your cart.</p>
      <FulfilmentToggle value={mode} onChange={setMode} />

      <div className="field">
        <label htmlFor="area-search">{mode === 'delivery' ? 'Your area' : 'Find a store'}</label>
        <div className="input-icon">
          <Icon name="search" size={18} />
          <input
            id="area-search"
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Nugegoda, Colombo 05, Kandy"
            autoComplete="off"
          />
        </div>
        <button type="button" className="link-btn" onClick={useMyLocation} disabled={geo === 'busy'}>
          <Icon name="locate" size={16} /> {geo === 'busy' ? 'Finding you…' : 'Use my current location'}
        </button>
        {geo === 'denied' && <p className="hint hint--warn">Location is turned off for this site. Pick your area from the list instead.</p>}
      </div>

      <ul className="store-list" role="listbox" aria-label={mode === 'delivery' ? 'Areas' : 'Stores'}>
        {matches.map((s) => (
          <li key={s.id}>
            <button type="button" role="option" aria-selected={storeId === s.id} className="store-opt" onClick={() => setStoreId(s.id)}>
              <span>
                <strong>{mode === 'delivery' ? s.city : `${s.area} store`}</strong>
                <span className="muted small">{mode === 'delivery' ? `From ${s.area} store` : s.address}</span>
              </span>
              <span className="store-opt__eta">
                <Icon name="clock" size={14} />
                {(mode === 'delivery' ? s.deliveryMins : s.pickupMins).join('–')} min
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="muted small store-empty">No stores match “{query}”. Try a nearby town.</li>}
      </ul>

      {mode === 'delivery' && selected && (
        <div className="address-fields">
          <div className="field">
            <label htmlFor="addr">House no. & street</label>
            <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 24/3, Lauries Road" autoComplete="street-address" />
          </div>
          <div className="field">
            <label htmlFor="landmark">
              Landmark <span className="muted">(optional, helps the rider)</span>
            </label>
            <input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Opposite the Keells, blue gate" />
          </div>
        </div>
      )}
    </Dialog>
  )
}
