import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Play, RotateCcw, SkipForward } from 'lucide-react'
import { useFinance } from '../state/store'
import { BeeScene } from './scene'
import { buildTour, type TourElements } from './director'
import './showcase.css'

const WORD = 'Ledgr'

declare global {
  interface Window {
    /** Frame-stepping hook used to render the tour to video deterministically. */
    __tour?: { step: (ms: number) => void; duration: number; done: () => boolean }
  }
}

function themeButton() {
  return document.querySelector<HTMLElement>('.topbar__actions [aria-label^="Switch to"]')
}

/**
 * Cinematic guided tour: a 3D bee flies over the live app, demonstrating real
 * interactions. The user's data and theme are snapshotted first and restored
 * when the tour ends, so nothing they did is lost.
 */
export default function Showcase({ onExit }: { onExit: () => void }) {
  const { state, dispatch } = useFinance()
  const [snapshot] = useState(() => state)
  const [initialTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')
  const [ended, setEnded] = useState(false)
  const [run, setRun] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const r = {
    backdrop: useRef<HTMLDivElement>(null),
    dim: useRef<HTMLDivElement>(null),
    vignette: useRef<HTMLDivElement>(null),
    streak: useRef<HTMLDivElement>(null),
    title: useRef<HTMLDivElement>(null),
    tagline: useRef<HTMLParagraphElement>(null),
    kicker: useRef<HTMLParagraphElement>(null),
    caption: useRef<HTMLDivElement>(null),
    capNum: useRef<HTMLSpanElement>(null),
    capTitle: useRef<HTMLParagraphElement>(null),
    capText: useRef<HTMLParagraphElement>(null),
    focus: useRef<HTMLDivElement>(null),
    progress: useRef<HTMLDivElement>(null),
    fx: useRef<HTMLDivElement>(null),
  }

  const exitRef = useRef<() => void>(() => {})
  exitRef.current = () => {
    dispatch({ type: 'restore', state: snapshot })
    if ((document.documentElement.dataset.theme ?? 'light') !== initialTheme) themeButton()?.click()
    window.location.hash = '#/overview'
    window.scrollTo(0, 0)
    onExit()
  }

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('.app')
    if (!stage || !canvas.current) return
    const mobile = window.innerWidth < 720
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const capture = new URLSearchParams(window.location.search).has('capture')

    // Start every run from the same clean demo state.
    dispatch({ type: 'reset' })
    if (document.documentElement.dataset.theme === 'dark') themeButton()?.click()
    document.querySelector<HTMLElement>('[aria-label="Show balances"]')?.click()
    if (!/^#\/(overview)?$/.test(window.location.hash)) window.location.hash = '#/overview'
    window.scrollTo(0, 0)
    setEnded(false)

    const scene = new BeeScene(canvas.current)
    scene.beeSize = mobile ? 0.66 : Math.min(1.15, Math.max(0.85, window.innerWidth / 1440))
    scene.trail = !reduced
    scene.ghosts = !reduced
    const resize = () => scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1)
    resize()
    window.addEventListener('resize', resize)

    const el: TourElements = {
      stage,
      backdrop: r.backdrop.current!,
      dim: r.dim.current!,
      vignette: r.vignette.current!,
      streak: r.streak.current!,
      title: r.title.current!,
      titleChars: [...r.title.current!.querySelectorAll<HTMLElement>('.sc-char')],
      tagline: r.tagline.current!,
      kicker: r.kicker.current!,
      caption: r.caption.current!,
      capNum: r.capNum.current!,
      capTitle: r.capTitle.current!,
      capText: r.capText.current!,
      focus: r.focus.current!,
      progress: r.progress.current!,
      fx: r.fx.current!,
    }
    gsap.set(el.title, { autoAlpha: 1, y: 0, scale: 1 })
    gsap.set(el.vignette, { autoAlpha: 0 })
    const tour = buildTour(scene, el, { mobile, reduced })
    tour.tl.eventCallback('onComplete', () => setEnded(true))

    // Drive GSAP from our own clock so a frame-stepped capture is identical to live playback.
    gsap.ticker.remove(gsap.updateRoot)
    const base = tour.tl.startTime()
    let elapsed = 0
    const frame = (dt: number) => {
      elapsed += dt
      gsap.updateRoot(base + elapsed)
      tour.tick()
      scene.update(dt)
    }

    let raf = 0
    if (capture) {
      window.__tour = {
        duration: tour.tl.duration(),
        done: () => tour.tl.progress() >= 1,
        step(ms) {
          // CSS transitions/animations in the app follow the same virtual clock.
          for (const a of document.getAnimations()) {
            if (a.playState === 'running') a.pause()
            if (a.playState === 'paused') a.currentTime = (Number(a.currentTime) || 0) + ms
          }
          frame(ms / 1000)
        },
      }
    } else {
      let last = performance.now()
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        frame(dt)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    // The tour drives the app; keep stray wheel/touch scrolling from fighting it.
    const block = (e: Event) => e.preventDefault()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && exitRef.current()
    const rootEl = root.current!
    rootEl.addEventListener('wheel', block, { passive: false })
    rootEl.addEventListener('touchmove', block, { passive: false })
    window.addEventListener('keydown', key)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', key)
      rootEl.removeEventListener('wheel', block)
      rootEl.removeEventListener('touchmove', block)
      tour.dispose()
      scene.dispose()
      gsap.ticker.add(gsap.updateRoot)
      delete window.__tour
      el.fx.replaceChildren()
    }
    // `run` restarts the whole sequence for "Replay".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  // Portalled to <body>: the app element itself is the "camera" stage and gets transformed.
  return createPortal(
    <div
      className="sc-root"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Guided product tour"
      data-capture={new URLSearchParams(window.location.search).has('capture') || undefined}
    >
      <div className="sc-backdrop" ref={r.backdrop} />
      <div className="sc-dim" ref={r.dim} />
      <div className="sc-vignette" ref={r.vignette} />
      <div className="sc-streak" ref={r.streak} />
      <div className="sc-focus" ref={r.focus} />
      <div className="sc-fx" ref={r.fx} />

      <div className="sc-title" ref={r.title}>
        <div className="sc-title__row">
          <svg className="sc-title__mark" viewBox="0 0 64 64" aria-hidden>
            <rect width="64" height="64" rx="18" fill="#1d3b0f" />
            <path d="M32 12c1.6 11.6 7.4 17.4 19 19-11.6 1.6-17.4 7.4-19 19-1.6-11.6-7.4-17.4-19-19 11.6-1.6 17.4-7.4 19-19z" fill="#bdee7c" />
          </svg>
          <h2 className="sc-title__word" aria-label={WORD}>
            {WORD.split('').map((c, i) => (
              <span key={i} className="sc-char" aria-hidden>
                {c}
              </span>
            ))}
          </h2>
        </div>
        <p className="sc-title__tagline" ref={r.tagline}>
          Personal finance, made calm.
        </p>
        <p className="sc-title__kicker" ref={r.kicker}>
          UI/UX prototype · guided tour
        </p>
      </div>

      <canvas className="sc-canvas" ref={canvas} aria-hidden />

      <div className="sc-caption" ref={r.caption} aria-live="polite">
        <span className="sc-caption__num" ref={r.capNum} />
        <div>
          <p className="sc-caption__title" ref={r.capTitle} />
          <p className="sc-caption__text" ref={r.capText} />
        </div>
      </div>

      <div className="sc-progress">
        <div ref={r.progress} />
      </div>

      {ended ? (
        <div className="sc-end">
          <button type="button" className="sc-btn sc-btn--ghost" onClick={() => setRun((n) => n + 1)}>
            <RotateCcw size={16} /> Replay
          </button>
          <button type="button" className="sc-btn sc-btn--primary" onClick={() => exitRef.current()}>
            <Play size={16} fill="currentColor" /> Explore the app
          </button>
        </div>
      ) : (
        <button type="button" className="sc-skip" onClick={() => exitRef.current()}>
          Skip tour <SkipForward size={14} />
        </button>
      )}
    </div>,
    document.body,
  )
}
