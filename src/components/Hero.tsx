import { useId, useRef } from 'react'
import { HERO_PHOTO } from '../data/menu'
import { scrollToSection } from '../lib/dom'
import { MOTION_OK, gsap, SplitText, useGSAP } from '../lib/gsap'
import { lkr } from '../lib/pricing'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

const RING_TEXT = 'HOT & FRESH • MADE TO ORDER • DELIVERED ISLANDWIDE • '

interface Props {
  query: string
  setQuery: (q: string) => void
  onSearch: () => void
}

export function Hero({ query, setQuery, onSearch }: Props) {
  const root = useRef<HTMLElement>(null)
  const ringId = `ring${useId().replace(/:/g, '')}`

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)

        // Intro: headline rises word by word, then the rest of the copy and the pizza land.
        SplitText.create(q('.hero__title')[0], {
          type: 'words',
          mask: 'words',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.07, delay: 0.15 }),
        })
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from(q('.hero__pill'), { y: 16, autoAlpha: 0, duration: 0.6 })
          .from(q('.hero__sub, .search, .hero__trust li'), { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 0.55)
          .from(q('.hero__plate'), { scale: 0.6, rotate: -140, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
          .from(q('.hero__ring'), { scale: 0.85, autoAlpha: 0, duration: 1 }, 0.5)
          .from(q('.hero__chip'), { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.15 }, 0.9)
          .from(q('.hero__scroll'), { autoAlpha: 0, y: -10, duration: 0.5 }, 1.3)

        // Ambient motion.
        gsap.to(q('.hero__ring svg'), { rotate: 360, duration: 40, ease: 'none', repeat: -1 })
        q('.hero__chip').forEach((chip, i) => gsap.to(chip, { y: -10, duration: 2.2 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 }))

        // Scroll: the pizza turns and the copy drifts away as the hero leaves the screen.
        const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
        gsap.to(q('.hero__plate'), { rotate: 100, yPercent: 12, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__copy'), { y: -70, opacity: 0.15, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__chip--deal'), { y: -120, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__chip--eta'), { y: 60, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__blob--blue'), { yPercent: 30, ease: 'none', scrollTrigger: scrub })

        // Mouse parallax on devices with a precise pointer.
        if (window.matchMedia('(pointer: fine)').matches) {
          const visual = q('.hero__visual')[0]
          const xTo = gsap.quickTo(visual, 'x', { duration: 0.8, ease: 'power3.out' })
          const yTo = gsap.quickTo(visual, 'y', { duration: 0.8, ease: 'power3.out' })
          const onMove = (e: PointerEvent) => {
            xTo((e.clientX / window.innerWidth - 0.5) * 24)
            yTo((e.clientY / window.innerHeight - 0.5) * 24)
          }
          window.addEventListener('pointermove', onMove)
          return () => window.removeEventListener('pointermove', onMove)
        }
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__blob hero__blob--blue" />
        <span className="hero__blob hero__blob--warm" />
      </div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="pill hero__pill">
            <Icon name="sparkle" size={14} /> Hot & fresh in about 30 minutes
          </span>
          <h1 id="hero-title" className="hero__title">
            Hot pizza, <span className="accent">made your way.</span>
          </h1>
          <p className="hero__sub">Real prices on every size, the best deal applied for you, and live tracking all the way to your door.</p>
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
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pizzas, sides, “spicy”, “veg”…"
            />
            <button type="submit" className="btn btn--primary">
              Search
            </button>
          </form>
          <ul className="hero__trust">
            <li>
              <Icon name="clock" size={16} /> ~30 min delivery
            </li>
            <li>
              <Icon name="tag" size={16} /> Best deal, automatically
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
          <div className="hero__plate">
            <FoodPhoto photo={HERO_PHOTO} width={460} alt="A freshly baked pizza on a wooden table" eager />
          </div>
          <button type="button" className="hero__chip hero__chip--deal" onClick={() => scrollToSection('deals')}>
            <span className="hero__chip-icon">
              <Icon name="tag" size={18} />
            </span>
            <span>
              <span className="hero__chip-label">Today’s deal</span>
              <strong>2 Mediums for {lkr(3990)}</strong>
            </span>
          </button>
          <div className="hero__chip hero__chip--eta" aria-hidden="true">
            <span className="hero__chip-icon hero__chip-icon--green">
              <Icon name="scooter" size={18} />
            </span>
            <span>
              <span className="hero__chip-label">On its way</span>
              <strong>In about 30 min</strong>
            </span>
          </div>
        </div>
      </div>

      <button type="button" className="hero__scroll" onClick={() => scrollToSection('menu')}>
        Explore the menu <Icon name="chevronDown" size={16} />
      </button>
    </section>
  )
}
