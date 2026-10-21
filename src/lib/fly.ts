import { gsap } from './gsap'

/** Flies a copy of `from` (usually a product photo) into the header cart button, then bounces the button. */
export function flyToCart(from: HTMLElement) {
  const cart = document.querySelector<HTMLElement>('.cart-btn')
  if (!cart || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const a = from.getBoundingClientRect()
  const b = cart.getBoundingClientRect()
  const clone = from.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    margin: '0',
    zIndex: '70',
    pointerEvents: 'none',
    overflow: 'hidden',
    borderRadius: '18px',
    boxShadow: '0 20px 40px rgb(0 0 0 / 25%)',
  })
  clone.setAttribute('aria-hidden', 'true')
  document.body.appendChild(clone)

  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  // Different eases on x and y give the flight a curved path.
  gsap
    .timeline({ onComplete: () => clone.remove() })
    .to(clone, { x: dx, duration: 0.75, ease: 'power1.inOut' }, 0)
    .to(clone, { y: dy, duration: 0.75, ease: 'back.in(1.6)' }, 0)
    .to(clone, { scale: 0.1, borderRadius: '50%', opacity: 0.7, duration: 0.75, ease: 'power2.in' }, 0)
  gsap.fromTo(cart, { scale: 1 }, { scale: 1.18, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, delay: 0.72 })
}
