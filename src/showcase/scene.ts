import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Bee } from './bee'
import { Particles } from './particles'

const FOV = 30
const LIME = new THREE.Color('#a7e05c')
const GOLD = new THREE.Color('#f2c94c')
const MINT = new THREE.Color('#d8f7a8')

/** Screen-space target for the bee: CSS pixels plus a depth (positive = towards the viewer). */
export interface BeeTarget {
  x: number
  y: number
  z: number
}

interface Pose {
  p: THREE.Vector3
  q: THREE.Quaternion
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Transparent WebGL layer laid over the live DOM. The world is set up so that
 * z = 0 maps 1:1 to CSS pixels, which lets the bee fly to real UI elements and
 * cast a real shadow onto them.
 */
export class BeeScene {
  readonly target: BeeTarget = { x: -200, y: 600, z: -300 }
  /** Global size multiplier for the bee (smaller on phones). */
  beeSize = 1
  /** 0..1 strength of the glowing halo — stronger on dark backdrops. */
  halo = 0.6
  dust = 0.5
  trail = true
  ghosts = true

  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 10, 6000)
  private bee = new Bee()
  private key: THREE.DirectionalLight
  private haloSprite: THREE.Sprite
  private tipGlows: THREE.Sprite[] = []
  private ghostGroups: THREE.Group[] = []
  private history: Pose[] = []
  private trailFx = new Particles(900)
  private sparks = new Particles(900)
  private motes = new Particles(260)
  private pos = new THREE.Vector3(-900, -400, -300)
  private vel = new THREE.Vector3()
  private yaw = 0
  private heading = 0
  private bank = 0
  private pitch = 0
  private time = 0
  private moteClock = 0
  private trailClock = 0
  private w = 1
  private h = 1
  private dist = 1000
  private dpr = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.75
    pmrem.dispose()

    // Cinematic three-point lighting: warm key (casts the shadow), cool fill, lime rim.
    this.scene.add(new THREE.HemisphereLight('#fffdf5', '#2d3a22', 0.7))
    this.key = new THREE.DirectionalLight('#fff4de', 2.4)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(1024, 1024)
    this.key.shadow.radius = 7
    this.key.shadow.bias = -0.0005
    const sc = this.key.shadow.camera
    sc.left = -220
    sc.right = 220
    sc.top = 220
    sc.bottom = -220
    sc.near = 1
    sc.far = 2400
    this.scene.add(this.key, this.key.target)
    const rim = new THREE.DirectionalLight('#c9f58f', 3.2)
    rim.position.set(300, 500, -900)
    this.scene.add(rim)
    const fill = new THREE.DirectionalLight('#cfe3ff', 0.6)
    fill.position.set(700, -200, 600)
    this.scene.add(fill)

    // Invisible plane at the UI surface that only shows the bee's shadow.
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.ShadowMaterial({ color: '#1d2a12', opacity: 0.2 }))
    catcher.receiveShadow = true
    this.scene.add(catcher)

    // Motion-blur ghosts: body silhouettes that trail along recent poses at speed.
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: '#b9a85a', transparent: true, opacity: 0, depthWrite: false })
      const g = this.bee.body.clone(true)
      g.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          ;(o as THREE.Mesh).material = mat
          o.castShadow = false
        }
      })
      const holder = new THREE.Group()
      holder.add(g)
      holder.visible = false
      this.ghostGroups.push(holder)
      this.scene.add(holder)
    }

    const glow = glowTexture()
    this.haloSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#c8f27e', transparent: true, depthWrite: false, opacity: 0.5 }))
    this.haloSprite.renderOrder = -1
    this.scene.add(this.haloSprite)
    for (let i = 0; i < 2; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#d8ff9a', transparent: true, depthWrite: false, opacity: 0.9 }))
      this.tipGlows.push(s)
      this.scene.add(s)
    }

    this.scene.add(this.bee.root, this.trailFx.points, this.sparks.points, this.motes.points)
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = Math.min(dpr, 2)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.dist = h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    this.camera.position.set(0, 0, this.dist)
    this.camera.near = 10
    this.camera.far = this.dist * 4
    this.camera.updateProjectionMatrix()
    for (const p of [this.trailFx, this.sparks, this.motes]) p.setScale(this.dist * this.dpr)
  }

  /** CSS pixel + depth → world. */
  toWorld(x: number, y: number, z: number, out = new THREE.Vector3()) {
    return out.set(x - this.w / 2, this.h / 2 - y, z)
  }

  /** Teleport (used when a scene cut needs the bee somewhere instantly). */
  place(t: BeeTarget) {
    this.target.x = t.x
    this.target.y = t.y
    this.target.z = t.z
    this.toWorld(t.x, t.y, t.z, this.pos)
    this.vel.set(0, 0, 0)
    this.history.length = 0
  }

  burst(x: number, y: number, opts: { count?: number; power?: number; z?: number; palette?: THREE.Color[] } = {}) {
    const count = opts.count ?? 28
    const power = opts.power ?? 1
    const palette = opts.palette ?? [LIME, GOLD, MINT]
    const p = this.toWorld(x, y, opts.z ?? 30)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const up = Math.random() * 2 - 1
      const sp = (90 + Math.random() * 230) * power
      this.sparks.emit({
        x: p.x,
        y: p.y,
        z: p.z,
        vx: Math.cos(a) * sp * Math.sqrt(1 - up * up),
        vy: Math.sin(a) * sp * Math.sqrt(1 - up * up) + 40,
        vz: up * sp * 0.6,
        life: 0.55 + Math.random() * 0.6,
        size: 7 + Math.random() * 9,
        color: palette[i % palette.length],
        drag: 2.6,
        gravity: 140,
      })
    }
  }

  update(dt: number) {
    this.time += dt
    const t = this.time

    // ── Flight: a slightly under-damped spring towards the target, plus hover wander.
    const goal = this.toWorld(this.target.x, this.target.y, this.target.z)
    goal.x += Math.sin(t * 1.3) * 6 + Math.sin(t * 2.9) * 3
    goal.y += Math.sin(t * 1.7 + 1) * 8 + Math.sin(t * 3.7) * 2
    goal.z += Math.sin(t * 0.9) * 12
    const k = 26
    const c = 2 * Math.sqrt(k) * 0.78
    const acc = goal.sub(this.pos).multiplyScalar(k).addScaledVector(this.vel, -c)
    const step = Math.min(dt, 1 / 30)
    let left = dt
    while (left > 1e-6) {
      const h = Math.min(step, left)
      this.vel.addScaledVector(acc, h)
      this.pos.addScaledVector(this.vel, h)
      left -= h
    }
    const speed = this.vel.length()
    const energy = THREE.MathUtils.clamp(speed / 900, 0, 1)

    // ── Orientation: face the direction of travel; idle with a 3/4 turn to camera.
    // Left is -π (not +π) so every turn swings through "facing the viewer", never away.
    if (this.vel.x > 60) this.heading = 0
    else if (this.vel.x < -60) this.heading = -Math.PI
    const idle = 1 - THREE.MathUtils.clamp(Math.abs(this.vel.x) / 160, 0, 1)
    const towardCam = this.heading === 0 ? -0.55 : 0.55
    const desiredYaw = this.heading + towardCam * idle
    this.yaw += (desiredYaw - this.yaw) * Math.min(1, dt * 5)
    this.bank += (THREE.MathUtils.clamp(-this.vel.y * 0.0007, -0.45, 0.45) - this.bank) * Math.min(1, dt * 6)
    const forwardSpeed = Math.abs(this.vel.x) + Math.abs(this.vel.y) * 0.5
    const desiredPitch = THREE.MathUtils.clamp(this.vel.y * 0.0006, -0.4, 0.4) - Math.min(0.25, forwardSpeed * 0.0003)
    this.pitch += (desiredPitch - this.pitch) * Math.min(1, dt * 6)

    const root = this.bee.root
    root.scale.setScalar(32 * this.beeSize)
    root.position.copy(this.pos)
    const qTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.32)
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.pitch)
    const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.bank)
    root.quaternion.copy(qTilt).multiply(qYaw).multiply(qPitch).multiply(qRoll)
    this.bee.update(dt, energy)

    // ── Key light rides with the bee so its shadow stays crisp; the offset sells height.
    this.key.position.set(this.pos.x - 260, this.pos.y + 380, this.pos.z + 700)
    this.key.target.position.set(this.pos.x, this.pos.y, 0)
    this.key.target.updateMatrixWorld()

    // ── Motion blur ghosts from pose history.
    this.history.unshift({ p: this.pos.clone(), q: root.quaternion.clone() })
    if (this.history.length > 14) this.history.pop()
    const blur = this.ghosts ? THREE.MathUtils.clamp((speed - 380) / 900, 0, 1) : 0
    this.ghostGroups.forEach((g, i) => {
      const pose = this.history[(i + 1) * 2]
      g.visible = blur > 0.01 && !!pose
      if (!g.visible || !pose) return
      g.position.copy(pose.p)
      g.quaternion.copy(pose.q)
      g.scale.copy(root.scale)
      const m = (g.children[0].children.find((o) => (o as THREE.Mesh).isMesh) as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined
      if (m) m.opacity = blur * (0.14 - i * 0.03)
    })

    // ── Glows.
    const s = root.scale.x
    this.haloSprite.position.copy(this.pos).add(new THREE.Vector3(0, 0, -20))
    this.haloSprite.scale.setScalar(s * (3.6 + Math.sin(t * 2) * 0.2))
    ;(this.haloSprite.material as THREE.SpriteMaterial).opacity = 0.2 * this.halo
    this.bee.antennaTips.forEach((tip, i) => {
      const g = this.tipGlows[i]
      tip.getWorldPosition(g.position)
      g.scale.setScalar(s * (0.6 + Math.sin(t * 6 + i) * 0.1))
      ;(g.material as THREE.SpriteMaterial).opacity = 0.5 + this.halo * 0.4
    })

    // ── Magic trail: emitted from the abdomen, denser when flying fast.
    if (this.trail) {
      this.trailClock += dt * (8 + speed * 0.09)
      const tail = new THREE.Vector3(-1.2, 0, 0).applyQuaternion(root.quaternion).multiplyScalar(s).add(this.pos)
      while (this.trailClock > 1) {
        this.trailClock -= 1
        this.trailFx.emit({
          x: tail.x + (Math.random() - 0.5) * 6,
          y: tail.y + (Math.random() - 0.5) * 6,
          z: tail.z,
          vx: -this.vel.x * 0.05 + (Math.random() - 0.5) * 18,
          vy: -this.vel.y * 0.05 + (Math.random() - 0.5) * 18 - 6,
          life: 0.7 + Math.random() * 0.8 + energy * 0.5,
          size: 4 + Math.random() * 6 + energy * 5,
          color: Math.random() < 0.6 ? LIME : GOLD,
          alpha: 0.55 + energy * 0.4,
          drag: 1.2,
        })
      }
    }

    // ── Ambient motes drifting through the frame.
    this.moteClock += dt * 24 * this.dust
    while (this.moteClock > 1) {
      this.moteClock -= 1
      this.motes.emit({
        x: (Math.random() - 0.5) * this.w * 1.2,
        y: (Math.random() - 0.5) * this.h * 1.2,
        z: -200 + Math.random() * 500,
        vx: 6 + Math.random() * 14,
        vy: 4 + Math.random() * 10,
        life: 4 + Math.random() * 4,
        size: 2.5 + Math.random() * 4,
        color: Math.random() < 0.5 ? MINT : GOLD,
        alpha: 0.25 + Math.random() * 0.35,
        drag: 0,
      })
    }

    this.trailFx.update(dt)
    this.sparks.update(dt)
    this.motes.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  /** Current on-screen position of the bee in CSS pixels. */
  screenPos() {
    return { x: this.pos.x + this.w / 2, y: this.h / 2 - this.pos.y, z: this.pos.z }
  }

  dispose() {
    this.renderer.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
      mats.forEach((mm) => mm.dispose())
    })
  }
}
