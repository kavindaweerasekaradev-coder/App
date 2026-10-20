import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, HERO_PHOTO, PRODUCTS, PRODUCT_BY_ID, type CategoryId, type Product } from '../data/menu'
import { STORE_BY_ID } from '../data/stores'
import { newKey } from '../lib/id'
import { scrollToSection } from '../lib/dom'
import { DEALS, describeItem, lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'
import { ProductCard } from './ProductCard'

type Filter = 'veg' | 'spicy'

function Hero({ query, setQuery, onSearch }: { query: string; setQuery: (q: string) => void; onSearch: () => void }) {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero__copy">
        <span className="pill">
          <Icon name="sparkle" size={14} /> Hot & fresh in about 30 minutes
        </span>
        <h1 id="hero-title">
          Pizza made fresh,
          <br />
          <span className="accent">delivered your way</span>
        </h1>
        <p className="hero__sub">Browse the full menu with real prices. Pick delivery or pickup whenever you’re ready. The best deal is applied for you.</p>
        <form
          className="search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            onSearch()
          }}
        >
          <Icon name="search" size={20} />
          <label htmlFor="menu-search" className="sr-only">
            Search the menu
          </label>
          <input id="menu-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pizzas, sides, “spicy”, “veg”…" />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>
      </div>
      <div className="hero__photo">
        <FoodPhoto photo={HERO_PHOTO} width={560} alt="A freshly baked pizza on a wooden table" eager />
        <button type="button" className="hero__sticker" onClick={() => scrollToSection('deals')}>
          <span className="hero__sticker-label">
            <Icon name="tag" size={12} /> Today’s deal
          </span>
          <strong>2 Medium pizzas for {lkr(3990)}</strong>
          <span>No code needed</span>
        </button>
      </div>
    </section>
  )
}

function Toolbar({
  category,
  setCategory,
  filters,
  toggleFilter,
}: {
  category: CategoryId | 'all'
  setCategory: (c: CategoryId | 'all') => void
  filters: Set<Filter>
  toggleFilter: (f: Filter) => void
}) {
  const chips: { id: CategoryId | 'all'; label: string }[] = [{ id: 'all', label: 'All' }, ...CATEGORIES]
  return (
    <div className="toolbar">
      <div className="container toolbar__inner">
        <div className="chip-row" role="tablist" aria-label="Menu categories">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              className={`chip ${category === c.id ? 'is-on' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
          <span className="chip-row__divider" aria-hidden="true" />
          <button
            type="button"
            aria-pressed={filters.has('veg')}
            className={`chip chip--filter ${filters.has('veg') ? 'is-on' : ''}`}
            onClick={() => toggleFilter('veg')}
          >
            <Icon name="leaf" size={15} /> Veg only
          </button>
          <button
            type="button"
            aria-pressed={filters.has('spicy')}
            className={`chip chip--filter ${filters.has('spicy') ? 'is-on' : ''}`}
            onClick={() => toggleFilter('spicy')}
          >
            <Icon name="flame" size={15} /> Spicy
          </button>
        </div>
      </div>
    </div>
  )
}

function Rail({ title, note, products }: { title: string; note: string; products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <section className="container section" aria-labelledby="rail-title">
      <div className="section__head">
        <h2 id="rail-title">{title}</h2>
        <p className="section__note">
          <Icon name="sparkle" size={14} /> {note}
        </p>
      </div>
      <div className="rail">
        <div className="rail__track" ref={ref}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} variant="feature" />
          ))}
        </div>
        <button type="button" className="rail__arrow rail__arrow--prev" onClick={() => scroll(-1)} aria-label="Scroll back">
          <Icon name="chevronLeft" />
        </button>
        <button type="button" className="rail__arrow rail__arrow--next" onClick={() => scroll(1)} aria-label="See more">
          <Icon name="chevronRight" />
        </button>
      </div>
    </section>
  )
}

function Deals() {
  const { setCartOpen } = useUi()
  const { state } = useStore()
  return (
    <section id="deals" className="panel panel--deals" aria-labelledby="deals-title">
      <div className="panel__head">
        <div>
          <h2 id="deals-title">Today’s deals</h2>
          <p className="muted small">No codes needed. We apply the one that saves you most.</p>
        </div>
        {state.cart.length > 0 && (
          <button type="button" className="link-btn" onClick={() => setCartOpen(true)}>
            See my savings <Icon name="chevronRight" size={16} />
          </button>
        )}
      </div>
      <ul className="deal-grid">
        {DEALS.map((d, i) => (
          <li key={d.code} className={`deal-card deal-card--${i}`}>
            <span className="deal-card__code">{d.code}</span>
            <h3>{d.title}</h3>
            <p className="small">{d.summary}</p>
            <details>
              <summary>Terms</summary>
              <ul>
                {d.terms.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

function OrderAgain() {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  const last = state.orders[0]
  if (!last) {
    return (
      <section className="panel panel--why" aria-labelledby="why-title">
        <h2 id="why-title">Ordering made simple</h2>
        <ul className="why-list">
          <li>
            <span className="why-list__icon">
              <Icon name="receipt" />
            </span>
            <div>
              <strong>Real prices, up front</strong>
              <p className="small muted">Every size is priced on the menu. Taxes are included and fees are shown before checkout.</p>
            </div>
          </li>
          <li>
            <span className="why-list__icon">
              <Icon name="tag" />
            </span>
            <div>
              <strong>Best deal, automatically</strong>
              <p className="small muted">No hunting for codes. Your cart always gets the biggest saving.</p>
            </div>
          </li>
          <li>
            <span className="why-list__icon">
              <Icon name="scooter" />
            </span>
            <div>
              <strong>Live order tracking</strong>
              <p className="small muted">See every step from oven to doorstep, with a clear arrival time.</p>
            </div>
          </li>
        </ul>
      </section>
    )
  }
  const reorder = () => {
    const before = state.cart
    last.items.forEach((i) => dispatch({ type: 'addItem', item: { ...i, key: newKey() } }))
    showToast({
      text: 'Your last order is in the cart',
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
      secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
    })
  }
  return (
    <section className="panel panel--again" aria-labelledby="again-title">
      <div className="panel__head">
        <div>
          <h2 id="again-title">Order again</h2>
          <p className="muted small">Your favourites, one tap away</p>
        </div>
        <a className="link-btn" href={`#/order/${last.id}`}>
          Last order <Icon name="chevronRight" size={16} />
        </a>
      </div>
      <ul className="again-list">
        {last.items.slice(0, 3).map((i) => {
          const p = PRODUCT_BY_ID[i.productId]
          return (
            <li key={i.key} className="again-item">
              <span className="again-item__art">
                <FoodPhoto photo={p.photo} width={56} />
              </span>
              <span className="again-item__text">
                <strong>{p.name}</strong>
                <span className="muted small">{describeItem(i)}</span>
              </span>
              <button
                type="button"
                className="add-btn add-btn--outline"
                aria-label={`Add ${p.name} again`}
                onClick={() => {
                  const before = state.cart
                  dispatch({ type: 'addItem', item: { ...i, qty: 1, key: newKey() } })
                  showToast({
                    text: `${p.name} added`,
                    action: { label: 'View cart', onClick: () => setCartOpen(true) },
                    secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
                  })
                }}
              >
                <Icon name="plus" size={18} />
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn btn--soft btn--block" onClick={reorder}>
        <Icon name="repeat" size={18} /> Reorder everything · {lkr(last.totals.subtotal)}
      </button>
    </section>
  )
}

function InfoBar() {
  const { state } = useStore()
  const { setLocationOpen } = useUi()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null
  const mins = store ? (state.fulfilment === 'delivery' ? store.deliveryMins : store.pickupMins) : null
  return (
    <section className="container info-bar" aria-label="Delivery details">
      <button type="button" className="info-card" onClick={() => setLocationOpen(true)}>
        <span className="info-card__icon">
          <Icon name={state.fulfilment === 'delivery' ? 'scooter' : 'store'} size={22} />
        </span>
        <span className="info-card__text">
          {store ? (
            <>
              <strong>
                {state.fulfilment === 'delivery' ? `Delivering to ${store.city}` : `Pickup from ${store.area}`}
                {state.location?.address ? ` · ${state.location.address}` : ''}
              </strong>
              <span className="accent-text">
                {state.fulfilment === 'delivery' ? 'Arrives in' : 'Ready in'} {mins![0]}–{mins![1]} min
              </span>
            </>
          ) : (
            <>
              <strong>Delivery or pickup?</strong>
              <span className="accent-text">Set your location to see arrival times</span>
            </>
          )}
        </span>
        <Icon name="chevronDown" size={18} />
      </button>
      <div className="info-card info-card--static">
        <span className="info-card__icon">
          <Icon name="shield" size={22} />
        </span>
        <span className="info-card__text">
          <strong>Pay your way, securely</strong>
          <span className="muted small">Cash, card on delivery or secure online card payment</span>
        </span>
      </div>
    </section>
  )
}

export function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [filters, setFilters] = useState<Set<Filter>>(new Set())
  const { state } = useStore()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null

  const toggleFilter = (f: Filter) =>
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      for (const f of filters) if (!p.tags.includes(f)) return false
      if (!q) return true
      const hay = `${p.name} ${p.description} ${p.tags.join(' ')} ${p.category}`.toLowerCase()
      return q.split(/\s+/).every((w) => hay.includes(w.replace(/s$/, '')))
    })
  }, [query, category, filters])

  const browsing = !query.trim() && category === 'all' && filters.size === 0
  const loved = ['devilled-chicken', 'pepperoni-classic', 'kochchi-paneer', 'chicken-wings', 'bbq-chicken', 'veggie-paradise'].map((id) => PRODUCT_BY_ID[id])

  const scrollToMenu = () => scrollToSection('menu')

  return (
    <>
      <Hero query={query} setQuery={setQuery} onSearch={scrollToMenu} />
      <Toolbar
        category={category}
        setCategory={(c) => {
          setCategory(c)
          scrollToMenu()
        }}
        filters={filters}
        toggleFilter={toggleFilter}
      />

      {browsing && (
        <>
          <Rail title={store ? `Most loved in ${store.city}` : 'Most loved right now'} note="Based on what people near you order" products={loved} />
          <div className="container two-up">
            <Deals />
            <OrderAgain />
          </div>
        </>
      )}

      <section id="menu" className="container section menu" aria-labelledby="menu-title">
        <div className="section__head">
          <h2 id="menu-title">{browsing ? 'Full menu' : `${results.length} result${results.length === 1 ? '' : 's'}`}</h2>
          {!browsing && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setQuery('')
                setCategory('all')
                setFilters(new Set())
              }}
            >
              <Icon name="x" size={16} /> Clear filters
            </button>
          )}
        </div>

        {results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="search" size={28} />
            </div>
            <h3>Nothing matches “{query || 'these filters'}”</h3>
            <p className="muted">Try “chicken”, “veg” or “spicy”, or clear the filters.</p>
          </div>
        )}

        {CATEGORIES.map((c) => {
          const items = results.filter((p) => p.category === c.id)
          if (!items.length) return null
          return (
            <div key={c.id} className="menu__group">
              <h3 className="menu__group-title">
                {c.label} <span className="muted">{items.length}</span>
              </h3>
              <div className="grid">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <InfoBar />
    </>
  )
}
