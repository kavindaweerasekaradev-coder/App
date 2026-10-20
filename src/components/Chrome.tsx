import { useEffect, useState } from 'react'
import { HOTLINE } from '../data/stores'
import { FREE_DELIVERY_FROM, MIN_DELIVERY_ORDER, lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Logo } from './Header'
import { Icon } from './Icon'

export function Toast() {
  const { toast, dismissToast, cartOpen, product, locationOpen } = useUi()
  // While a panel is open its action buttons sit at the bottom, so show toasts at the top.
  const top = cartOpen || !!product || locationOpen
  return (
    <div className={`toast-region ${top ? 'toast-region--top' : ''}`} aria-live="polite" aria-atomic="true">
      {toast && (
        <div className="toast" key={toast.id}>
          <Icon name="check" size={18} />
          <span className="toast__text">{toast.text}</span>
          {toast.secondary && (
            <button
              type="button"
              className="toast__btn toast__btn--ghost"
              onClick={() => {
                toast.secondary!.onClick()
                dismissToast()
              }}
            >
              {toast.secondary.label}
            </button>
          )}
          {toast.action && (
            <button
              type="button"
              className="toast__btn"
              onClick={() => {
                toast.action!.onClick()
                dismissToast()
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (online) return null
  return (
    <div className="offline" role="status">
      <Icon name="wifiOff" size={18} /> You’re offline. Your cart is saved and you can keep browsing. We’ll reconnect automatically.
    </div>
  )
}

export function MobileCartBar() {
  const { totals } = useStore()
  const { setCartOpen, cartOpen } = useUi()
  if (!totals.itemCount || cartOpen) return null
  return (
    <div className="mobile-cart">
      <button type="button" className="btn btn--primary btn--block btn--split" onClick={() => setCartOpen(true)}>
        <span>
          <Icon name="bag" size={18} /> View cart · {totals.itemCount} item{totals.itemCount > 1 ? 's' : ''}
        </span>
        <span>{lkr(totals.total)}</span>
      </button>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <Logo />
          <p className="muted small">Hot, fresh pizza from 50+ stores across Sri Lanka.</p>
        </div>
        <div>
          <h2 className="site-footer__h">Help</h2>
          <ul>
            <li>
              <a href={`tel:${HOTLINE.replace(/\s/g, '')}`}>Hotline {HOTLINE}</a>
            </li>
            <li>Open daily, 10:00 am – 11:00 pm</li>
          </ul>
        </div>
        <div>
          <h2 className="site-footer__h">Good to know</h2>
          <ul>
            <li>All prices include taxes</li>
            <li>Minimum delivery order {lkr(MIN_DELIVERY_ORDER)}</li>
            <li>Free delivery over {lkr(FREE_DELIVERY_FROM)}</li>
          </ul>
        </div>
      </div>
      <p className="container site-footer__legal small muted">
        Design concept for a redesigned ordering experience. Not affiliated with or endorsed by Domino’s Pizza. Food photos from{' '}
        <a href="https://unsplash.com" target="_blank" rel="noreferrer">
          Unsplash
        </a>
        .
      </p>
    </footer>
  )
}
