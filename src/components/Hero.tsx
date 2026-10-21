import { useEffect, useId, useRef, useState } from 'react'
import { HERO_PHOTO, PRODUCTS, PRODUCT_BY_ID, fromPrice } from '../data/menu'
import { scrollToSection } from '../lib/dom'
import { MOTION_OK, gsap, SplitText, useGSAP } from '../lib/gsap'
import { lkr } from '../lib/pricing'
import { useQuickAdd } from '../state/useQuickAdd'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

const RING_TEXT = 'HOT & FRESH • MADE TO ORDER • DELIVERED ISLANDWIDE • '
const ORBIT = ['chicken-wings', 'garlic-bread', 'cola']
const LOWEST_PIZZA = Math.min(...PRODUCTS.filter((p) => p.category === 'pizza').map(fromPrice))
const TICKER = [
  `2 Medium pizzas for ${lkr(3990)}`,
  `Free delivery over ${lkr(4000)}`,
  '20% off Large pizzas',
  '15% off on pickup',
  'Best deal applied automatically',
  'Prices include all taxes',
  '50+ stores islandwide',
]

/** Time left until midnight, when today's deal ends. */
function useUntilMidnight() {
  const calc = () => {
    const end = new Date()
    end.setHours(24, 0, 0, 0)
    const s = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000))
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = window.setInterval(() => setLeft(calc()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return left
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const ringId = `ring${useId().replace(/:/g, '')}`
  const quickAdd = useQuickAdd()
  const timeLeft = useUntilMidnight()

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)

        // Intro: the card opens up, the headline rises word by word, then the food lands.
        SplitText.create(q('.hero__title')[0], {
          type: 'words',
          mask: 'words',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.07, delay: 0.25 }),
        })
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from(q('.hero__card'), { scale: 0.96, autoAlpha: 0, duration: 0.8 })
          .from(q('.hero__pill'), { y: 16, autoAlpha: 0, duration: 0.6 }, 0.3)
          .from(q('.hero__sub, .hero__ctas > *, .hero__proof li'), { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.7)
          .from(q('.hero__plate'), { scale: 0.5, rotate: -160, autoAlpha: 0, duration: 1.5, ease: 'expo.out' }, 0.35)
          .from(q('.hero__ring'), { scale: 0.8, autoAlpha: 0, duration: 1 }, 0.6)
          .from(q('.hero__orbit'), { scale: 0, autoAlpha: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.12 }, 1)
          .from(q('.hero__burst'), { scale: 0, rotate: -180, duration: 0.9, ease: 'back.out(1.6)' }, 1.1)
          .from(q('.hero__ticket'), { y: 40, autoAlpha: 0, duration: 0.8 }, 1.25)
          .from(q('.ticker'), { autoAlpha: 0, duration: 0.6 }, 1.3)

        // Ambient motion: slow spin, rising steam, floating sides, pulsing price badge, scrolling offers.
        gsap.to(q('.hero__ring svg'), { rotate: 360, duration: 40, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__plate .photo'), { rotate: 360, duration: 90, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__burst-shape'), { rotate: 360, duration: 24, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__burst'), { scale: 1.07, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 })
        q('.hero__orbit').forEach((el, i) => gsap.to(el, { y: -12, duration: 2 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 + i * 0.2 }))
        q('.hero__steam path').forEach((el, i) =>
          gsap.fromTo(el, { y: 10, autoAlpha: 0 }, { y: -40, autoAlpha: 0.7, duration: 1.6, ease: 'sine.out', repeat: -1, yoyo: true, delay: 1.5 + i * 0.5 }),
        )
        gsap.to(q('.ticker__track'), { xPercent: -50, duration: 32, ease: 'none', repeat: -1 })

        // Scroll: the pizza turns and grows, the sides drift outward and the copy fades as the hero leaves.
        const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
        gsap.to(q('.hero__plate'), { rotate: 120, scale: 1.12, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__copy'), { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: scrub })

        if (window.matchMedia('(pointer: fine)').matches) {
          // The food follows the mouse slightly; the main button leans toward the cursor.
          const visual = q('.hero__visual')[0]
          const xTo = gsap.quickTo(visual, 'x', { duration: 0.8, ease: 'power3.out' })
          const yTo = gsap.quickTo(visual, 'y', { duration: 0.8, ease: 'power3.out' })
          const onMove = (e: PointerEvent) => {
            xTo((e.clientX / window.innerWidth - 0.5) * 26)
            yTo((e.clientY / window.innerHeight - 0.5) * 26)
          }
          const cta = q('.btn--hot')[0] as HTMLElement
          const bx = gsap.quickTo(cta, 'x', { duration: 0.4, ease: 'power3.out' })
          const by = gsap.quickTo(cta, 'y', { duration: 0.4, ease: 'power3.out' })
          const onCta = (e: PointerEvent) => {
            const r = cta.getBoundingClientRect()
            bx((e.clientX - r.left - r.width / 2) * 0.25)
            by((e.clientY - r.top - r.height / 2) * 0.35)
          }
          const offCta = () => (bx(0), by(0))
          window.addEventListener('pointermove', onMove)
          cta.addEventListener('pointermove', onCta)
          cta.addEventListener('pointerleave', offCta)
          return () => {
            window.removeEventListener('pointermove', onMove)
            cta.removeEventListener('pointermove', onCta)
            cta.removeEventListener('pointerleave', offCta)
          }
        }
      })

      // On wide screens the sides and deal ticket also drift apart; on phones they'd be pushed off the card.
      gsap.matchMedia().add(`${MOTION_OK} and (min-width: 961px)`, () => {
        const q = gsap.utils.selector(root)
        const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
        q('.hero__orbit').forEach((el, i) => gsap.to(el, { x: [-70, 80, 60][i], y: [-60, -20, 70][i], ease: 'none', scrollTrigger: scrub }))
        gsap.to(q('.hero__ticket'), { y: -50, ease: 'none', scrollTrigger: scrub })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero__card">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__inner">
            <div className="hero__copy">
              <span className="hero__pill">
                <Icon name="flame" size={15} /> Hot & fresh in about 30 minutes
              </span>
              <h1 id="hero-title" className="hero__title">
                Hot pizza, <span className="hero__accent">made your way.</span>
              </h1>
              <p className="hero__sub">
                Cheesy, fresh from the oven and at your door in about 30 minutes. Real prices on every size, and the best deal is always applied for you.
              </p>
              <div className="hero__ctas">
                <button type="button" className="btn btn--hot btn--lg" onClick={() => scrollToSection('menu')}>
                  Order now <Icon name="chevronRight" size={18} />
                </button>
                <button type="button" className="btn btn--glass btn--lg" onClick={() => scrollToSection('deals')}>
                  <Icon name="tag" size={18} /> See today’s deals
                </button>
              </div>
              <ul className="hero__proof">
                <li>
                  <Icon name="store" size={16} /> 50+ stores islandwide
                </li>
                <li>
                  <Icon name="clock" size={16} /> ~30 min delivery
                </li>
                <li>
                  <Icon name="receipt" size={16} /> Taxes included
                </li>
              </ul>
            </div>

            <div className="hero__visual">
              <div className="hero__ring" aria-hidden="true">
                <svg viewBox="0 0 500 500">
                  <defs>
                    <path id={ringId} d="M250,250 m-232,0 a232,232 0 1,1 464,0 a232,232 0 1,1 -464,0" />
                  </defs>
                  <text>
                    <textPath href={`#${ringId}`} textLength="1450" lengthAdjust="spacing">
                      {RING_TEXT.repeat(2)}
                    </textPath>
                  </text>
                </svg>
              </div>
              <svg className="hero__steam" viewBox="0 0 120 80" aria-hidden="true">
                <path d="M30 78 C 18 62, 42 52, 30 36 S 38 12, 30 2" />
                <path d="M60 78 C 48 62, 72 52, 60 36 S 68 12, 60 2" />
                <path d="M90 78 C 78 62, 102 52, 90 36 S 98 12, 90 2" />
              </svg>
              <div className="hero__plate">
                <FoodPhoto photo={HERO_PHOTO} width={460} alt="A freshly baked pizza, hot from the oven" eager />
              </div>

              {ORBIT.map((id, i) => {
                const p = PRODUCT_BY_ID[id]
                return (
                  <button
                    key={id}
                    type="button"
                    className={`hero__orbit hero__orbit--${i}`}
                    onClick={() => quickAdd(id)}
                    aria-label={`Add ${p.name}, ${lkr(fromPrice(p))}`}
                  >
                    <span className="hero__orbit-photo">
                      <FoodPhoto photo={p.photo} width={88} />
                    </span>
                    <span className="hero__orbit-tag">
                      <Icon name="plus" size={12} /> {lkr(fromPrice(p))}
                    </span>
                  </button>
                )
              })}

              <div className="hero__burst" aria-hidden="true">
                <svg className="hero__burst-shape" viewBox="0 0 100 100">
                  <polygon points={burstPoints(16, 50, 41)} />
                </svg>
                <span className="hero__burst-text">
                  <small>From</small>
                  <strong>{lkr(LOWEST_PIZZA)}</strong>
                </span>
              </div>

              <div className="hero__ticket">
                <span className="hero__ticket-label">
                  <Icon name="tag" size={13} /> Today’s deal
                </span>
                <strong className="hero__ticket-title">2 Medium pizzas</strong>
                <span className="hero__ticket-price">
                  for <b>{lkr(3990)}</b>
                </span>
                <span className="hero__ticket-timer" role="timer">
                  <Icon name="clock" size={13} /> Ends in <b>{timeLeft}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ticker" aria-label="Current offers">
        <ul className="ticker__track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <li key={i} aria-hidden={i >= TICKER.length}>
              <Icon name="sparkle" size={14} /> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Points for a star-shaped price badge with `n` spikes. */
function burstPoints(n: number, outer: number, inner: number) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
  }).join(' ')
}
