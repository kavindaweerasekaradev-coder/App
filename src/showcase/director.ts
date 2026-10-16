import gsap from 'gsap'
import * as THREE from 'three'
import type { BeeScene } from './scene'

export interface TourElements {
  stage: HTMLElement
  backdrop: HTMLElement
  dim: HTMLElement
  vignette: HTMLElement
  streak: HTMLElement
  title: HTMLElement
  titleChars: HTMLElement[]
  tagline: HTMLElement
  kicker: HTMLElement
  caption: HTMLElement
  capNum: HTMLElement
  capTitle: HTMLElement
  capText: HTMLElement
  focus: HTMLElement
  progress: HTMLElement
  fx: HTMLElement
}

interface Pt {
  x: number
  y: number
}

type ElGetter = () => HTMLElement | null | undefined

const GOLD = [new THREE.Color('#f2c94c'), new THREE.Color('#ffe9a3'), new THREE.Color('#a7e05c')]
const GREEN = [new THREE.Color('#5fbf3a'), new THREE.Color('#bdee7c'), new THREE.Color('#e8ffd0')]

const $ = (sel: string) => document.querySelector<HTMLElement>(sel)
const visible = (e: HTMLElement) => e.getClientRects().length > 0
const $$ = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].filter(visible)
const byText = (sel: string, text: string) => $$(sel).find((e) => e.textContent?.trim().includes(text))
const nav = (name: string) => () => byText('.nav-pills__item, .bottom-nav__item', name)
const radio = (label: string) => () => $(`.segmented__item[aria-label="${label}"]`)

/** React listens for the native value setter + an input event on controlled inputs. */
function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function hover(el: Element | null | undefined) {
  el?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
}

function unhover(el: Element | null | undefined) {
  el?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }))
}

export interface Tour {
  tl: gsap.core.Timeline
  /** Per-frame sync of everything that follows live DOM positions. */
  tick: () => void
  dispose: () => void
}

export function buildTour(scene: BeeScene, el: TourElements, opts: { mobile: boolean; reduced: boolean }): Tour {
  const { mobile, reduced } = opts
  const W = () => window.innerWidth
  const H = () => window.innerHeight
  const bt = scene.target
  const tilt = mobile ? 0.4 : 1
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

  let anchor: (() => Pt) | null = null
  let focusGet: ElGetter | null = null
  const lastPt = new Map<ElGetter, Pt>()
  const cam = { x: 0, y: 0, s: 1, rx: 0, ry: 0, blur: 0, o: 1 }

  /** A live point on an element: (ax, ay) are fractions of its box, (dx, dy) pixel offsets. */
  const at = (get: ElGetter, ax = 0.5, ay = 0.5, dx = 0, dy = 0) => {
    return (): Pt => {
      const e = get()
      if (e && visible(e)) {
        const r = e.getBoundingClientRect()
        const p = { x: r.left + r.width * ax + dx, y: r.top + r.height * ay + dy }
        lastPt.set(get, p)
        return p
      }
      return lastPt.get(get) ?? { x: bt.x, y: bt.y }
    }
  }
  /** Perch: just above the top-right of an element, so the bee never covers the content. */
  const perch = (get: ElGetter, dx = 6, dy = -22) => at(get, 1, 0, dx * (mobile ? 0.6 : 1), dy * (mobile ? 0.7 : 1))
  const screen = (fx: number, fy: number) => () => ({ x: W() * fx, y: H() * fy })

  function fly(t: number, to: () => Pt, o: { dur?: number; z?: number; arc?: number; ease?: string } = {}) {
    const p = { k: 0 }
    let sx = 0
    let sy = 0
    let sz = 0
    const z = o.z ?? 70
    const arc = (o.arc ?? 70) * (mobile ? 0.6 : 1)
    tl.to(
      p,
      {
        k: 1,
        duration: reduced ? Math.min(0.5, o.dur ?? 1.1) : (o.dur ?? 1.1),
        ease: o.ease ?? 'power2.inOut',
        onStart() {
          anchor = null
          sx = bt.x
          sy = bt.y
          sz = bt.z
        },
        onUpdate() {
          const e = to()
          const k = p.k
          bt.x = sx + (e.x - sx) * k
          bt.y = sy + (e.y - sy) * k - Math.sin(Math.PI * k) * arc
          bt.z = sz + (z - sz) * k + Math.sin(Math.PI * k) * 50
        },
        onComplete() {
          anchor = to
        },
      },
      t,
    )
  }

  function tap(t: number, get: ElGetter, o: { burst?: number; palette?: THREE.Color[] } = {}) {
    // The bee dips towards the surface as it "presses".
    tl.to(bt, { z: 18, duration: 0.16, ease: 'power2.in', yoyo: true, repeat: 1 }, t - 0.16)
    tl.call(
      () => {
        const e = get()
        if (!e) return
        const r = e.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        ripple(x, y)
        if (!reduced) scene.burst(x, y, { count: o.burst ?? 22, palette: o.palette, power: 0.8 })
        e.click()
      },
      [],
      t,
    )
  }

  function ripple(x: number, y: number) {
    const r = document.createElement('div')
    r.className = 'sc-ripple'
    r.style.left = `${x}px`
    r.style.top = `${y}px`
    el.fx.appendChild(r)
    gsap.fromTo(r, { scale: 0.2, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.7, ease: 'power2.out', onComplete: () => r.remove() })
  }

  function type(t: number, get: () => HTMLInputElement | null, text: string, every = 0.08) {
    for (let i = 1; i <= text.length; i++) {
      tl.call(
        () => {
          const input = get()
          if (input) setNativeValue(input, text.slice(0, i))
        },
        [],
        t + i * every,
      )
    }
    return text.length * every
  }

  function caption(t: number, num: string, title: string, text: string, near?: ElGetter) {
    tl.to(el.caption, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in' }, t)
    tl.call(
      () => {
        el.capNum.textContent = num
        el.capTitle.textContent = title
        el.capText.textContent = text
        // Sit on the side opposite to what we're pointing at, so nothing is covered.
        const e = near?.()
        const side = !mobile && e && e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2 < W() / 2 ? 'right' : 'left'
        el.caption.dataset.side = side
      },
      [],
      t + 0.3,
    )
    tl.fromTo(el.caption, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, t + 0.32)
  }

  function hideCaption(t: number) {
    tl.to(el.caption, { autoAlpha: 0, y: -8, duration: 0.35, ease: 'power2.in' }, t)
  }

  function focus(t: number, get: ElGetter) {
    tl.call(() => void (focusGet = get), [], t)
    tl.fromTo(el.focus, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', immediateRender: false }, t)
  }

  function unfocus(t: number) {
    tl.to(el.focus, { autoAlpha: 0, duration: 0.3 }, t)
    tl.call(() => void (focusGet = null), [], t + 0.3)
  }

  function camTo(t: number, v: Partial<typeof cam>, dur = 1.4, ease = 'power3.inOut') {
    if (reduced) return
    const scaled = { ...v }
    if (scaled.rx !== undefined) scaled.rx *= tilt
    if (scaled.ry !== undefined) scaled.ry *= tilt
    tl.to(cam, { ...scaled, duration: dur, ease }, t)
  }

  const camHome = { x: 0, y: 0, s: 1, rx: 0, ry: 0, blur: 0, o: 1 }

  function scrollTo(t: number, get: () => number, dur = 1) {
    const p = { k: 0 }
    let from = 0
    let to = 0
    tl.to(
      p,
      {
        k: 1,
        duration: dur,
        ease: 'power3.inOut',
        onStart() {
          from = window.scrollY
          const max = document.documentElement.scrollHeight - H()
          to = Math.max(0, Math.min(max, get()))
        },
        onUpdate() {
          window.scrollTo(0, from + (to - from) * p.k)
        },
      },
      t,
    )
  }
  const topOf = (sel: string, offset = mobile ? 76 : 96) => () => {
    const e = $(sel)
    return e ? e.getBoundingClientRect().top + window.scrollY - offset : 0
  }

  /** Bring an element into a comfortable band of the viewport (no-op if it's already there). */
  const intoView = (get: ElGetter) => () => {
    const e = get()
    if (!e) return window.scrollY
    const r = e.getBoundingClientRect()
    const band = mobile ? H() * 0.62 : H() - 220
    if (r.top >= 70 && r.bottom <= band) return window.scrollY
    return r.top + window.scrollY - (mobile ? 120 : 140)
  }

  function streak(t: number, dur = 0.9) {
    if (reduced) return
    tl.fromTo(el.streak, { xPercent: -110, autoAlpha: 1 }, { xPercent: 110, duration: dur, ease: 'power2.inOut', immediateRender: false }, t)
    tl.set(el.streak, { autoAlpha: 0 }, t + dur)
  }

  function sparkleAlong(t: number, get: ElGetter, n = 3, palette = GOLD) {
    for (let i = 0; i < n; i++) {
      tl.call(
        () => {
          const e = get()
          if (!e || reduced) return
          const r = e.getBoundingClientRect()
          scene.burst(r.left + (r.width * (i + 0.5)) / n, r.top + r.height / 2, { count: 16, palette, power: 0.6 })
        },
        [],
        t + i * 0.18,
      )
    }
  }

  // ───────────────────────────── 1 · INTRO ─────────────────────────────
  const mark = el.title.querySelector<HTMLElement>('.sc-title__mark')!
  gsap.set(el.titleChars, { autoAlpha: 0, yPercent: 60, rotateX: -70 })
  gsap.set(mark, { autoAlpha: 0, scale: 0.5, rotate: -25 })
  gsap.set([el.tagline, el.kicker], { autoAlpha: 0, y: 14 })
  gsap.set(el.caption, { autoAlpha: 0 })
  gsap.set(el.focus, { autoAlpha: 0 })
  gsap.set(el.streak, { autoAlpha: 0 })
  gsap.set(el.dim, { autoAlpha: 0 })
  gsap.set(el.backdrop, { '--ir': '-140px', '--ix': '50%', '--iy': '60%', autoAlpha: 1 })
  Object.assign(cam, reduced ? camHome : { x: 0, y: 160, s: 0.62, rx: 52 * tilt, ry: 0, blur: 10, o: 0 })
  scene.place({ x: -W() * 0.12, y: H() * 0.86, z: -600 })
  scene.halo = 1
  scene.dust = 1

  const titleLeft = at(() => el.title.querySelector<HTMLElement>('.sc-title__mark'), 0, 0.5, mobile ? -34 : -58, -6)
  fly(0.2, screen(0.3, 0.44), { dur: 1.7, z: mobile ? 260 : 420, arc: 140, ease: 'power2.out' })
  fly(1.9, screen(0.66, 0.34), { dur: 1.2, z: 160, arc: -80 })
  fly(3.1, titleLeft, { dur: 1.2, z: 90, arc: 60 })
  tl.to(mark, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.7)' }, 2.25)
  tl.to(el.titleChars, { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 2.5)
  tl.call(() => void (!reduced && scene.burst(W() / 2, H() * 0.46, { count: 40, power: 1.2, z: 140 })), [], 2.6)
  tl.to(el.tagline, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 3.2)
  tl.to(el.kicker, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 3.5)
  streak(3.6, 1.1)

  // ───────────────────────────── 2 · REVEAL ─────────────────────────────
  tl.to([el.title], { autoAlpha: 0, y: -50, scale: 0.96, duration: 0.8, ease: 'power3.in' }, 5.4)
  fly(5.5, screen(0.5, 0.6), { dur: 0.9, z: 300, arc: -40, ease: 'power2.in' })
  tl.call(() => void (!reduced && scene.burst(W() / 2, H() * 0.6, { count: 70, power: 1.6, z: 200 })), [], 6.35)
  tl.to(el.backdrop, { '--ir': `${Math.hypot(W(), H()) + 200}px`, duration: 1.7, ease: 'power2.inOut' }, 6.3)
  tl.set(el.backdrop, { autoAlpha: 0 }, 8.0)
  tl.to(scene, { halo: 0.45, dust: 0.25, duration: 1.5 }, 6.4)
  if (!reduced) tl.to(cam, { ...camHome, duration: 2.4, ease: 'expo.out' }, 6.3)
  tl.to(el.vignette, { autoAlpha: 1, duration: 1.2 }, 7)
  fly(7.0, perch(() => $('.avatar'), 4, -14), { dur: 1.2, z: 60 })
  caption(7.6, 'Hi!', 'Meet Ledgr', 'A calm personal-finance dashboard. Let me show you around.', () => $('.avatar'))

  // ───────────────────────────── 3 · TOUR ─────────────────────────────
  let t = 10.2

  // 01 · Balance & currency
  focus(t, () => $('.balance'))
  caption(t, '01', 'Your money at a glance', 'One hero number across all accounts — in the currency you think in.', () => $('.balance'))
  fly(t, at(() => $('.hero-number'), 1, 0.2, 34, -6), { dur: 1.2 })
  camTo(t, { s: 1.03, rx: 2, ry: -3 }, 1.8)
  t += 1.7
  for (const label of ['Euro', 'Sri Lankan Rupee', 'US Dollar']) {
    fly(t, perch(radio(label), -10, -20), { dur: 0.7, arc: 30, z: 50 })
    t += 0.8
    tap(t, radio(label))
    t += 0.9
  }
  const eye = () => $('.balance__figure .icon-btn')
  fly(t, perch(eye, 4, -16), { dur: 0.7, arc: 30, z: 50 })
  t += 0.8
  tap(t, eye)
  t += 1.0
  tap(t, eye)
  t += 0.7
  unfocus(t)

  // 02 · Goal spotlight
  focus(t, () => $('.spotlight'))
  caption(t, '02', 'Progress worth celebrating', 'Your closest goal takes the spotlight, with exactly what it needs to finish on time.', () => $('.spotlight'))
  fly(t, at(() => $('.spotlight__amount'), 1, 0.5, 40, -10), { dur: 1.1, arc: 90 })
  camTo(t, { s: 1.03, rx: 2, ry: 3 }, 1.6)
  sparkleAlong(t + 1.2, () => $('.spotlight .progress'), 4)
  t += 3.2
  unfocus(t)
  camTo(t, camHome, 1.2)

  // 03 · Spending insight
  scrollTo(t, topOf('.spending'), 1.1)
  t += 0.6
  focus(t + 0.5, () => $('.spending'))
  caption(t + 0.5, '03', 'Spending, explained in one line', 'No chart decoding: Ledgr says what changed and by how much.', () => $('.spending'))
  fly(t, at(() => $('.donut'), 0.92, 0.12), { dur: 1.1 })
  t += 1.4
  const legend = (i: number) => () => $$('.spending .legend__item')[i]
  for (const i of [0, 1, 3]) {
    fly(t, at(legend(i), 0.35, 0, 0, -18), { dur: 0.6, arc: 24, z: 45 })
    tl.call(() => hover(legend(i)()), [], t + 0.45)
    t += 0.85
    tl.call(() => unhover(legend(i)()), [], t)
  }
  tl.call(() => unhover($('.spending .donut')), [], t)
  fly(t, perch(() => $('.insight'), 0, -18), { dur: 0.8, arc: 40 })
  tl.fromTo(el.focus, { scale: 1 }, { scale: 1.015, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, t + 0.8)
  t += 1.8
  unfocus(t)

  // 04 · Review queue
  const approve = () => $('.review [aria-label^="Approve"]')
  focus(t, () => $('.review'))
  caption(t, '04', 'Catch surprise charges', 'New recurring payments wait for your approval — one tap and done.', () => $('.transactions'))
  fly(t, perch(approve, 2, -18), { dur: 1.1, arc: 80 })
  camTo(t, { s: 1.02, rx: 1.5, ry: 3 }, 1.4)
  t += 1.6
  tap(t, approve, { burst: 34, palette: GREEN })
  t += 1.4
  unfocus(t)
  camTo(t, camHome, 1)

  // 05 · Cash flow
  scrollTo(t, topOf('.cashflow'), 1.1)
  t += 0.6
  focus(t + 0.5, () => $('.cashflow'))
  caption(t + 0.5, '05', 'Six months of cash flow', 'Money in versus money out, with the exact numbers a hover away.', () => $('.cashflow'))
  const col = (i: number) => () => $$('.chart svg rect[fill="transparent"]')[i]
  t += 0.7
  for (const i of [1, 3, 5]) {
    fly(t, at(col(i), 0.62, 0.3), { dur: 0.75, arc: 40 })
    tl.call(() => hover(col(i)()), [], t + 0.55)
    t += 1.15
  }
  tl.call(() => unhover(col(5)()), [], t)
  unfocus(t)

  // 06 · Add a transaction
  scrollTo(t, () => 0, 1.1)
  camTo(t, camHome, 0.6)
  const addBtn = () => $('.balance .btn--primary')
  fly(t, perch(addBtn, 0, -20), { dur: 1.3, arc: 90 })
  caption(t + 0.4, '06', 'Log a transaction in seconds', 'Amount, payee, category — and every number on the dashboard updates live.', addBtn)
  t += 1.6
  tap(t, addBtn)
  t += 0.7
  const amount = () => $('.amount-field input') as HTMLInputElement | null
  const payee = () => $('input[placeholder="e.g. Whole Foods"]') as HTMLInputElement | null
  const food = () => byText('.choice__box', 'Food')
  const save = () => $('button[form="add-txn"]')
  fly(t, at(amount, 0.5, 0, 0, -16), { dur: 0.8, z: 50 })
  t += 0.8
  t += type(t, amount, '84.20', 0.12) + 0.3
  fly(t, at(payee, 0.55, 0, 0, -14), { dur: 0.7, z: 50, arc: 30 })
  t += 0.7
  t += type(t, payee, 'Corner Bistro', 0.065) + 0.3
  fly(t, perch(food, -6, -16), { dur: 0.7, z: 50, arc: 30 })
  t += 0.75
  tap(t, food)
  t += 0.6
  fly(t, perch(save, -8, -18), { dur: 0.75, z: 50, arc: 40 })
  t += 0.8
  tap(t, save, { burst: 30, palette: GREEN })
  t += 0.5
  fly(t, at(() => $('.hero-number'), 1, 0.2, 34, -6), { dur: 1 })
  focus(t + 0.3, () => $('.balance'))
  tl.call(() => void (!reduced && sparkleAlongNow($('.hero-number'))), [], t + 0.9)
  t += 2
  unfocus(t)

  function sparkleAlongNow(e: HTMLElement | null) {
    if (!e) return
    const r = e.getBoundingClientRect()
    for (let i = 0; i < 4; i++) scene.burst(r.left + (r.width * (i + 0.5)) / 4, r.top + r.height / 2, { count: 12, palette: GREEN, power: 0.55 })
  }

  // 07 · Budgets
  fly(t, perch(nav('Budgets'), -4, -14), { dur: 1.1, arc: 60 })
  t += 1.2
  tap(t, nav('Budgets'))
  streak(t + 0.05, 0.8)
  camTo(t, { s: 0.97, o: 0.85 }, 0.25, 'power2.out')
  camTo(t + 0.25, camHome, 0.9, 'expo.out')
  t += 0.6
  const tile = () => $$('.budget-tile')[1]
  scrollTo(t + 0.2, intoView(tile), 0.9)
  focus(t + 0.3, tile)
  caption(t + 0.3, '07', 'Budgets that warn you early', 'Each category shows its pace, its status, and what’s left to spend per day.', tile)
  fly(t, at(tile, 0.92, 0.12), { dur: 1.1, arc: 50 })
  camTo(t + 0.3, { s: 1.02, rx: 1.5, ry: -2.5 }, 1.6)
  sparkleAlong(t + 1.3, () => tile()?.querySelector<HTMLElement>('.progress'), 3, GREEN)
  t += 2.9
  unfocus(t)
  camTo(t, camHome, 0.8)

  // 08 · Goals
  fly(t, perch(nav('Goals'), -4, -14), { dur: 1, arc: 60 })
  t += 1.1
  tap(t, nav('Goals'))
  streak(t + 0.05, 0.8)
  camTo(t, { s: 0.97, o: 0.85 }, 0.25, 'power2.out')
  camTo(t + 0.25, camHome, 0.9, 'expo.out')
  t += 0.6
  const goal = () => $$('.goal')[1]
  const addMoney = () => goal()?.querySelector<HTMLElement>('.goal__cta')
  scrollTo(t + 0.2, intoView(goal), 0.9)
  focus(t + 0.3, goal)
  caption(t + 0.3, '08', 'Every contribution counts', 'Fund a goal in two taps and watch the progress move.', goal)
  fly(t, perch(addMoney, -12, -18), { dur: 1.1, arc: 50 })
  t += 1.5
  unfocus(t - 0.1)
  tap(t, addMoney)
  t += 0.7
  const chip = () => byText('.chip-btn', '+250')
  const fund = () => $('button[form="fund-goal"]')
  fly(t, perch(chip, -6, -16), { dur: 0.8, z: 50 })
  t += 0.85
  tap(t, chip)
  t += 0.6
  fly(t, perch(fund, -8, -18), { dur: 0.7, z: 50, arc: 30 })
  t += 0.75
  tap(t, fund, { burst: 40, palette: GOLD })
  t += 0.55
  fly(t, at(() => goal()?.querySelector<HTMLElement>('.goal__amount'), 1, 0.2, 30, -10), { dur: 0.9 })
  sparkleAlong(t + 0.6, () => goal()?.querySelector<HTMLElement>('.progress'), 4, GOLD)
  t += 1.9

  // 09 · Dark mode
  const themeBtn = () => $('.topbar__actions [aria-label="Switch to dark mode"]') ?? $('.topbar__actions [aria-label="Switch to light mode"]')
  scrollTo(t, () => 0, 0.9)
  caption(t, '09', 'Calm by day, beautiful by night', 'A hand-tuned dark theme, from the charts down to the shadows.', themeBtn)
  fly(t, perch(themeBtn, -6, 26), { dur: 1.1, arc: -40 })
  t += 1.25
  tap(t, themeBtn, { burst: 30 })
  streak(t + 0.1, 1)
  t += 1.4
  fly(t, perch(nav('Overview'), -4, -14), { dur: 0.9, arc: 50 })
  t += 1.0
  tap(t, nav('Overview'))
  t += 0.6

  // ───────────────────────────── 4 · FINALE ─────────────────────────────
  hideCaption(t)
  tl.call(() => window.scrollTo(0, 0), [], t)
  camTo(t + 0.2, { s: mobile ? 0.82 : 0.72, rx: 16, ry: -9, y: mobile ? 10 : 34, blur: 1.6 }, 2.2, 'power3.inOut')
  tl.to(el.dim, { autoAlpha: 1, duration: 1.6 }, t + 0.4)
  tl.to(scene, { halo: 1, dust: 0.8, duration: 1.4 }, t + 0.4)
  // An orbit around the finished interface.
  const orbit = { a: 0 }
  fly(t, screen(0.86, 0.5), { dur: 1, z: 160, arc: 60 })
  tl.to(
    orbit,
    {
      a: Math.PI * 2,
      duration: 3.4,
      ease: 'sine.inOut',
      onStart: () => void (anchor = null),
      onUpdate: () => {
        bt.x = W() * (0.5 + Math.cos(orbit.a) * (mobile ? 0.34 : 0.36))
        bt.y = H() * (0.5 + Math.sin(orbit.a) * (mobile ? 0.3 : 0.27))
        bt.z = 160 + Math.sin(orbit.a + 1) * 140
      },
    },
    t + 1,
  )
  t += 4.5
  // Title card returns; the bee settles beside the mark.
  tl.set(el.title, { y: 0, scale: 1 }, t - 0.6)
  tl.set(el.titleChars, { autoAlpha: 0, yPercent: 60, rotateX: -70 }, t - 0.6)
  tl.set(mark, { autoAlpha: 0, scale: 0.5, rotate: -25 }, t - 0.6)
  tl.to(mark, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.7)' }, t - 0.55)
  tl.set([el.tagline, el.kicker], { autoAlpha: 0, y: 14 }, t - 0.6)
  tl.to(el.title, { autoAlpha: 1, duration: 0.01 }, t - 0.5)
  tl.to(el.titleChars, { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, t - 0.4)
  tl.to(el.tagline, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, t + 0.2)
  tl.to(el.kicker, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, t + 0.45)
  tl.to(el.dim, { '--dim': 0.86, duration: 1.2 }, t - 0.6)
  fly(t - 0.4, titleLeft, { dur: 1.3, z: 90, arc: 80, ease: 'power3.inOut' })
  tl.call(() => void (!reduced && scene.burst(W() / 2, H() * 0.46, { count: 50, power: 1.1, z: 140, palette: GOLD })), [], t + 0.9)
  streak(t + 0.6, 1.2)
  tl.to({}, { duration: 2.2 }, t + 1)

  function tick() {
    if (anchor) {
      const p = anchor()
      bt.x = p.x
      bt.y = p.y
    }
    // Focus ring follows its element, matching its corner radius.
    const f = focusGet?.()
    if (f && visible(f)) {
      const r = f.getBoundingClientRect()
      const pad = mobile ? 5 : 7
      el.focus.style.left = `${r.left - pad}px`
      el.focus.style.top = `${r.top - pad}px`
      el.focus.style.width = `${r.width + pad * 2}px`
      el.focus.style.height = `${r.height + pad * 2}px`
      el.focus.style.borderRadius = `${(parseFloat(getComputedStyle(f).borderTopLeftRadius) || 16) + pad}px`
      el.focus.style.display = ''
    } else if (focusGet) {
      el.focus.style.display = 'none'
    }
    // DOM "camera": a perspective transform pivoting on the centre of the viewport.
    const s = el.stage.style
    const identity = Math.abs(cam.s - 1) < 1e-3 && Math.abs(cam.rx) < 0.02 && Math.abs(cam.ry) < 0.02 && Math.abs(cam.x) < 0.3 && Math.abs(cam.y) < 0.3
    if (identity) {
      // Leave no transform/filter so position:fixed children (modals, tab bar) behave.
      s.transform = ''
      s.transformOrigin = ''
    } else {
      const ox = window.scrollX + W() / 2 - el.stage.offsetLeft
      const oy = window.scrollY + H() / 2 - el.stage.offsetTop
      s.transformOrigin = `${ox}px ${oy}px`
      s.transform = `perspective(1600px) translate3d(${cam.x}px, ${cam.y}px, 0) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) scale(${cam.s})`
    }
    s.filter = cam.blur > 0.05 ? `blur(${cam.blur}px)` : ''
    s.opacity = cam.o < 0.999 ? String(cam.o) : ''
    el.caption.dataset.modal = document.querySelector('.modal') ? 'open' : ''
    el.progress.style.transform = `scaleX(${tl.progress()})`
  }

  return {
    tl,
    tick,
    dispose() {
      tl.kill()
      const s = el.stage.style
      s.transform = ''
      s.transformOrigin = ''
      s.filter = ''
      s.opacity = ''
    },
  }
}
