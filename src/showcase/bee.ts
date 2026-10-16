import * as THREE from 'three'

/**
 * A stylised, procedurally built bee. Everything is generated in code, so
 * there are no external assets or licences to track.
 *
 * Model space: the bee faces +x, up is +y and the wings spread along ±z.
 * One model unit is roughly a third of the body length; the scene scales it.
 */

const GOLD = '#f4c20d'
const INK = '#121310'
const LIME = '#bdee7c'

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Stripes run along the lathe's v coordinate (0 at the waist, 1 at the tail). */
function stripeTextures() {
  const bands: [number, number, string][] = [
    [0, 0.2, GOLD],
    [0.2, 0.36, INK],
    [0.36, 0.52, GOLD],
    [0.52, 0.7, INK],
    [0.7, 0.82, GOLD],
    [0.82, 1, INK],
  ]
  const map = canvasTexture(8, 512, (g) => {
    for (const [a, b, col] of bands) {
      g.fillStyle = col
      g.fillRect(0, a * 512, 8, (b - a) * 512)
    }
    // Soft fuzz at band edges so stripes don't look painted on.
    for (let y = 0; y < 512; y += 2) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`
      g.fillRect(0, y, 8, 1)
    }
  })
  // A thin emissive "circuit" line inside two dark bands: the futuristic touch.
  const glow = canvasTexture(8, 512, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 8, 512)
    g.fillStyle = LIME
    g.fillRect(0, 0.27 * 512, 8, 5)
    g.fillRect(0, 0.6 * 512, 8, 5)
  })
  return { map, glow }
}

function wingTexture() {
  return canvasTexture(512, 256, (g) => {
    const W = 512
    const H = 256
    g.clearRect(0, 0, W, H)
    const base = g.createLinearGradient(0, 0, W, 0)
    base.addColorStop(0, 'rgba(235,250,240,0.55)')
    base.addColorStop(1, 'rgba(235,250,240,0.22)')
    g.fillStyle = base
    g.fillRect(0, 0, W, H)
    g.strokeStyle = 'rgba(40,48,36,0.55)'
    g.lineCap = 'round'
    const vein = (pts: number[][], w: number) => {
      g.lineWidth = w
      g.beginPath()
      g.moveTo(pts[0][0] * W, pts[0][1] * H)
      for (let i = 1; i < pts.length - 1; i += 2) g.quadraticCurveTo(pts[i][0] * W, pts[i][1] * H, pts[i + 1][0] * W, pts[i + 1][1] * H)
      g.stroke()
    }
    vein([[0, 0.62], [0.45, 0.72], [0.95, 0.85]], 5)
    vein([[0, 0.55], [0.4, 0.5], [0.82, 0.52]], 3.5)
    vein([[0.05, 0.5], [0.35, 0.32], [0.7, 0.3]], 3)
    vein([[0.35, 0.5], [0.45, 0.3], [0.5, 0.12]], 2.5)
    vein([[0.55, 0.52], [0.62, 0.35], [0.66, 0.2]], 2.5)
    vein([[0.3, 0.68], [0.36, 0.5], [0.4, 0.33]], 2)
    vein([[0.7, 0.52], [0.78, 0.66], [0.86, 0.82]], 2)
  })
}

function wingEdgeGlow() {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 256, 128)
    const grad = g.createLinearGradient(0, 0, 256, 0)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, LIME)
    g.fillStyle = grad
    g.fillRect(150, 0, 106, 128)
  })
}

function wingGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.25, 0.22, 0.85, 0.24, 1.22, 0.1)
  s.bezierCurveTo(1.38, 0.02, 1.32, -0.24, 1.05, -0.33)
  s.bezierCurveTo(0.75, -0.42, 0.3, -0.34, 0.12, -0.16)
  s.lineTo(0, 0)
  const geo = new THREE.ShapeGeometry(s, 24)
  // Normalise UVs to 0..1 over the wing's bounds so the vein texture fits.
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.36, (pos.getY(i) + 0.42) / 0.68)
  // Shape is in XY with span along x; lay it flat (span → +z, chord → +x).
  geo.rotateX(-Math.PI / 2)
  geo.rotateY(-Math.PI / 2)
  return geo
}

function tube(points: THREE.Vector3[], radius: number, mat: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points)
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 8, false), mat)
  m.castShadow = true
  return m
}

interface Wing {
  pivot: THREE.Group
  side: 1 | -1
  ghosts: THREE.Mesh[]
  hind: boolean
}

export class Bee {
  readonly root = new THREE.Group()
  /** Body-only group (no wings): cloned for motion-blur ghosts. */
  readonly body = new THREE.Group()
  readonly antennaTips: THREE.Object3D[] = []
  private wings: Wing[] = []
  private blurDiscs: THREE.Mesh[] = []
  private abdomen!: THREE.Mesh
  private antennae: THREE.Group[] = []
  private phase = 0
  private t = 0

  constructor() {
    const { map, glow } = stripeTextures()
    const fuzz = new THREE.MeshPhysicalMaterial({ color: '#5a4520', roughness: 0.92, sheen: 1, sheenColor: new THREE.Color('#ffd98a'), sheenRoughness: 0.45 })
    const dark = new THREE.MeshPhysicalMaterial({ color: '#1a1c19', roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 })
    const abdomenMat = new THREE.MeshPhysicalMaterial({
      map,
      emissiveMap: glow,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 2,
      roughness: 0.5,
      sheen: 0.25,
      sheenColor: new THREE.Color('#fff3b0'),
      sheenRoughness: 0.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
    })
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#0a0b0a', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })
    const sparkle = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    const tipMat = new THREE.MeshStandardMaterial({ color: LIME, emissive: new THREE.Color(LIME), emissiveIntensity: 2.2 })

    // Abdomen: a lathe-turned egg, rotated so the tail points back (-x) and droops a little.
    const profile = [
      [0.001, 0.05], [0.24, 0.02], [0.4, -0.12], [0.48, -0.36], [0.49, -0.58], [0.43, -0.84], [0.3, -1.05], [0.13, -1.2], [0.001, -1.25],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const abGeo = new THREE.LatheGeometry(profile, 48)
    abGeo.rotateZ(-Math.PI / 2)
    this.abdomen = new THREE.Mesh(abGeo, abdomenMat)
    this.abdomen.position.set(-0.3, -0.02, 0)
    this.abdomen.rotation.z = 0.24
    this.abdomen.castShadow = true
    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 12), dark)
    stinger.rotation.z = Math.PI / 2
    stinger.position.set(-1.33, 0, 0)
    this.abdomen.add(stinger)

    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.37, 40, 28), fuzz)
    thorax.scale.set(1.05, 0.95, 0.95)
    thorax.castShadow = true
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.1, 16, 40), fuzz)
    collar.rotation.y = Math.PI / 2
    collar.position.x = 0.3
    collar.castShadow = true

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 40, 28), dark)
    head.scale.set(0.85, 1, 1.02)
    head.position.set(0.56, 0.03, 0)
    head.castShadow = true

    // Big glossy eyes with catch-lights: the "cute" in cute-but-futuristic.
    for (const s of [1, -1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), eyeMat)
      eye.scale.set(0.72, 1.18, 0.7)
      eye.position.set(0.62, 0.07, 0.19 * s)
      eye.rotation.y = 0.5 * s
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), sparkle)
      hl.position.set(0.7, 0.17, 0.27 * s)
      const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), sparkle)
      hl2.position.set(0.74, 0.05, 0.25 * s)
      this.body.add(eye, hl, hl2)

      const ant = new THREE.Group()
      ant.position.set(0.66, 0.24, 0.07 * s)
      ant.add(tube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 0.3, 0.06 * s), new THREE.Vector3(0.32, 0.5, 0.16 * s)], 0.022, dark))
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 12), tipMat)
      tip.position.set(0.33, 0.51, 0.165 * s)
      ant.add(tip)
      this.antennaTips.push(tip)
      this.antennae.push(ant)
      this.body.add(ant)

      // Three legs a side, tucked under like a bee in flight.
      for (const [i, x] of [0.18, 0, -0.18].entries()) {
        this.body.add(
          tube(
            [new THREE.Vector3(x, -0.22, 0.12 * s), new THREE.Vector3(x + 0.02, -0.42, 0.26 * s), new THREE.Vector3(x - 0.08 - i * 0.04, -0.62, 0.3 * s)],
            0.026,
            dark,
          ),
        )
      }
    }

    this.body.add(this.abdomen, thorax, collar, head)
    this.root.add(this.body)

    // Wings: iridescent membranes with vein texture and a faint lime edge glow.
    const wingMat = new THREE.MeshPhysicalMaterial({
      map: wingTexture(),
      emissiveMap: wingEdgeGlow(),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.55,
      transparent: true,
      roughness: 0.12,
      metalness: 0,
      iridescence: 1,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [180, 620],
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const geo = wingGeometry()
    const blurMat = new THREE.MeshBasicMaterial({ color: '#f3ffe6', transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
    for (const hind of [false, true]) {
      for (const side of [1, -1] as const) {
        const pivot = new THREE.Group()
        pivot.position.set(hind ? -0.1 : 0.08, 0.3, 0.09 * side)
        const scale = hind ? 0.62 : 1
        const make = (mat: THREE.Material) => {
          const m = new THREE.Mesh(geo, mat)
          m.scale.set(scale, 1, scale * side)
          m.renderOrder = 2
          return m
        }
        pivot.add(make(wingMat))
        // Two phase-shifted copies fake the motion blur of a beating wing.
        const ghosts = [0.5, 0.3].map((o) => {
          const gm = wingMat.clone()
          gm.opacity = o
          const g = new THREE.Mesh(geo, gm)
          g.scale.set(scale, 1, scale * side)
          g.renderOrder = 1
          return g
        })
        const ghostPivots = ghosts.map((g) => {
          const p = new THREE.Group()
          p.add(g)
          return p
        })
        pivot.userData.ghostPivots = ghostPivots
        this.root.add(pivot, ...ghostPivots)
        ghostPivots.forEach((p) => p.position.copy(pivot.position))
        this.wings.push({ pivot, side, ghosts, hind })
      }
    }
    // Translucent sweep discs read as the blur of fast wingbeats.
    // Wings rotate about the body axis, so the tips sweep a fan in the y–z plane.
    for (const side of [1, -1]) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32, -0.6, 1.9), blurMat)
      disc.rotation.y = (-Math.PI / 2) * side
      disc.position.set(-0.05, 0.3, 0.09 * side)
      disc.renderOrder = 0
      this.blurDiscs.push(disc)
      this.root.add(disc)
    }
  }

  /** Advance wingbeats and idle motion. `energy` 0..1 rises with flight speed. */
  update(dt: number, energy: number) {
    this.t += dt
    const freq = 19 + energy * 9
    this.phase += dt * freq * Math.PI * 2
    const amp = 0.95 + energy * 0.25
    const beat = (p: number) => 0.35 + Math.sin(p) * amp
    for (const w of this.wings) {
      const p = this.phase + (w.hind ? 0.5 : 0)
      const set = (g: THREE.Object3D, ph: number) => {
        g.rotation.set(-beat(ph) * w.side, 0, Math.cos(ph) * 0.22)
      }
      set(w.pivot, p)
      const ghosts = w.pivot.userData.ghostPivots as THREE.Group[]
      ghosts.forEach((g, i) => set(g, p - (i + 1) * 0.55))
    }
    for (const d of this.blurDiscs) (d.material as THREE.MeshBasicMaterial).opacity = 0.05 + energy * 0.07
    // Breathing abdomen and twitchy antennae keep it alive while hovering.
    const breathe = 1 + Math.sin(this.t * 3.1) * 0.025
    this.abdomen.scale.set(1, breathe, breathe)
    this.abdomen.rotation.z = 0.24 + Math.sin(this.t * 2.3) * 0.05 - energy * 0.08
    this.antennae.forEach((a, i) => {
      a.rotation.z = Math.sin(this.t * 4 + i) * 0.12 - energy * 0.25
      a.rotation.x = Math.sin(this.t * 2.6 + i * 2) * 0.08
    })
  }
}
